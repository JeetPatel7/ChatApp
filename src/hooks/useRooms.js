import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export function useRooms() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRooms = useCallback(async () => {
    if (!user) return
    try {
      const { data, error: fetchError } = await supabase
        .from('room_members')
        .select(`
          room:rooms(
            id, name, description, is_dm, created_at,
            room_members(user_id, profiles!user_id(display_name, avatar_color))
          )
        `)
        .eq('user_id', user.id)

      if (fetchError) {
        console.error('Rooms fetch error:', fetchError)
        setError(fetchError.message)
        setRooms([])
      } else {
        const roomList = data?.map(r => r.room).filter(Boolean) || []
        setRooms(roomList)
        setError(null)
      }
    } catch (err) {
      console.error('Rooms fetch failed:', err)
      setError(err.message)
      setRooms([])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRooms()

    if (!user?.id) return

    // Listen for new memberships
    const channel = supabase
      .channel('room_members_changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_members',
        filter: `user_id=eq.${user.id}`,
      }, fetchRooms)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, fetchRooms])

  const createRoom = useCallback(async (name, description = '') => {
    if (!user) return { error: 'Not authenticated' }
    try {
      // Generate room ID client-side to avoid RLS SELECT issue
      const roomId = crypto.randomUUID()
      const { error: insertError } = await supabase
        .from('rooms')
        .insert({ id: roomId, name, description, created_by: user.id })
      if (insertError) {
        console.error('Create room error:', insertError)
        return { error: insertError }
      }
      // Auto-join as member
      const { error: joinError } = await supabase
        .from('room_members')
        .insert({ room_id: roomId, user_id: user.id })
      if (joinError) {
        console.error('Auto-join error:', joinError)
        return { error: joinError }
      }
      await fetchRooms()
      return { room: { id: roomId, name, description } }
    } catch (err) {
      console.error('Create room failed:', err)
      return { error: err.message }
    }
  }, [user, fetchRooms])

  const joinRoom = useCallback(async (roomId) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: roomId, user_id: user.id })
      if (!error) fetchRooms()
      return { error }
    } catch (err) {
      return { error: err.message }
    }
  }, [user, fetchRooms])

  const leaveRoom = useCallback(async (roomId) => {
    try {
      await supabase.from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)
      fetchRooms()
    } catch (err) {
      console.error('Leave room error:', err)
    }
  }, [user, fetchRooms])

  // All discoverable rooms (for join modal)
  const fetchAllRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, description, room_members(count)')
        .eq('is_dm', false)
        .order('created_at', { ascending: true })
      if (error) {
        console.error('fetchAllRooms error:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('fetchAllRooms failed:', err)
      return []
    }
  }, [])

  return { rooms, loading, error, createRoom, joinRoom, leaveRoom, fetchAllRooms }
}
