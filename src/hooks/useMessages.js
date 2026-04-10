import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export function useMessages(roomId) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const channelRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Fetch initial messages with sender profiles + reactions
  const fetchMessages = useCallback(async () => {
    if (!roomId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, display_name, avatar_color, email),
          reply_to:messages!reply_to_id(id, content, sender:profiles!sender_id(display_name)),
          reactions(id, emoji, user_id, profiles!user_id(display_name))
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) {
        console.error('Messages fetch error:', error)
        setMessages([])
      } else {
        setMessages(data || [])
      }
    } catch (err) {
      console.error('Messages fetch failed:', err)
      setMessages([])
    }
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    if (!roomId || !user) {
      setLoading(false)
      return
    }
    fetchMessages()

    // Clean up old channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Realtime channel for messages + presence
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: user.id } },
    })

    // New message
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    }, async (payload) => {
      try {
        // Fetch full message with relations
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id(id, display_name, avatar_color, email),
            reply_to:messages!reply_to_id(id, content, sender:profiles!sender_id(display_name)),
            reactions(id, emoji, user_id, profiles!user_id(display_name))
          `)
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setMessages(prev => {
            // Prevent duplicates / replace optimistic message with real db message
            const exists = prev.find(m => m.id === payload.new.id)
            if (exists) return prev.map(m => m.id === payload.new.id ? data : m)
            return [...prev, data]
          })
        }
      } catch (err) {
        console.error('Realtime message fetch error:', err)
      }
    })

    // Reaction changes
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'reactions',
    }, () => {
      // Refetch to update reactions
      fetchMessages()
    })

    // Presence (online users + typing)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flat()
      setOnlineUsers(users)
      const typing = users.filter(u => u.typing && u.user_id !== user.id)
      setTypingUsers(typing.map(u => u.display_name))
    })

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      setOnlineUsers(prev => {
        const ids = prev.map(u => u.user_id)
        const fresh = newPresences.filter(u => !ids.includes(u.user_id))
        return [...prev, ...fresh]
      })
    })

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const leftIds = leftPresences.map(u => u.user_id)
      setOnlineUsers(prev => prev.filter(u => !leftIds.includes(u.user_id)))
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            user_id: user.id,
            display_name: profile?.display_name || user.email,
            avatar_color: profile?.avatar_color || '#185FA5',
            typing: false,
            online_at: new Date().toISOString(),
          })
        } catch (err) {
          console.error('Presence track error:', err)
        }
      }
    })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user, profile])

  // Broadcast typing indicator
  const setTyping = useCallback(async (isTyping) => {
    if (!channelRef.current || !profile) return
    try {
      await channelRef.current.track({
        user_id: user.id,
        display_name: profile.display_name,
        avatar_color: profile.avatar_color,
        typing: isTyping,
        online_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Typing track error:', err)
    }
  }, [user, profile])

  const handleTyping = useCallback(() => {
    setTyping(true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000)
  }, [setTyping])

  // Send message
  const sendMessage = useCallback(async (content, replyToId = null) => {
    if (!content.trim() || !roomId || !user) return
    setTyping(false)

    // 1. Optimistic Update (makes it feel instant)
    const tempId = crypto.randomUUID()
    const optimisticMsg = {
      id: tempId,
      room_id: roomId,
      sender_id: user.id,
      content: content.trim(),
      reply_to_id: replyToId || null,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        display_name: profile?.display_name || user.email,
        avatar_color: profile?.avatar_color || '#185FA5',
        email: user.email,
      },
      reactions: [],
      reply_to: null, // Basic optimistic, real reply_to comes via realtime sync
      pending: true, // Tells UI to show a clock icon
    }
    setMessages(prev => [...prev, optimisticMsg])

    // 2. Background Insert
    try {
      const { error } = await supabase.from('messages').insert({
        id: tempId, // Pass the same ID so the realtime event replaces this exact one
        room_id: roomId,
        sender_id: user.id,
        content: content.trim(),
        reply_to_id: replyToId || null,
      })
      if (error) {
        console.error('Send message error:', error)
        // Rollback
        setMessages(prev => prev.filter(m => m.id !== tempId))
        return { error }
      }
      // Insert successful. Realtime will replace it with the final data object,
      // but we can immediately mark it as not pending to show ticks:
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, pending: false } : m))
      return { error: null }
    } catch (err) {
      console.error('Send message exception:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      return { error: err }
    }
  }, [roomId, user, profile, setTyping])

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId, emoji) => {
    if (!user) return
    try {
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single()

      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id)
      } else {
        await supabase.from('reactions').insert({ message_id: messageId, user_id: user.id, emoji })
      }
    } catch (err) {
      console.error('Reaction toggle error:', err)
    }
  }, [user])

  return { messages, loading, typingUsers, onlineUsers, sendMessage, handleTyping, toggleReaction }
}
