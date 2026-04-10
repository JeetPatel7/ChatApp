import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import Avatar from './Avatar'

function dateSeparator(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

export default function ChatArea({ roomId, rooms }) {
  const { user } = useAuth()
  const { messages, loading, typingUsers, onlineUsers, sendMessage, handleTyping, toggleReaction } = useMessages(roomId)
  const [input, setInput] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const room = rooms?.find(r => r.id === roomId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  useEffect(() => {
    inputRef.current?.focus()
  }, [roomId])

  async function handleSend() {
    if (!input.trim()) return
    const textToSend = input
    const replyId = replyTo?.id
    
    // Instantly clear UI for snappy feel
    setInput('')
    setReplyTo(null)
    
    // Background send without blocking UI
    sendMessage(textToSend, replyId)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  const grouped = []
  let lastDate = null
  messages.forEach(msg => {
    const d = dateSeparator(msg.created_at)
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d }
    grouped.push({ type: 'message', msg })
  })

  if (!roomId) {
    return (
      <div style={{ ...styles.area, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
            Pick a room to start chatting
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
            Or create a new room from the sidebar
          </div>
        </div>
      </div>
    )
  }

  const onlineIds = onlineUsers.map(u => u.user_id)

  return (
    <div style={styles.area}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.roomIcon}>#</div>
          <div>
            <div style={styles.roomName}>{room?.name || 'Loading...'}</div>
            <div style={styles.roomMeta}>
              {onlineUsers.length > 0
                ? `${onlineUsers.length} online`
                : room?.description || 'No description'}
            </div>
          </div>
        </div>
        {/* Online avatars */}
        <div style={{ display: 'flex', gap: '-4px' }}>
          {onlineUsers.slice(0, 5).map((u, i) => (
            <div key={u.user_id} style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: 5 - i }}>
              <Avatar
                name={u.display_name || '?'}
                color={u.avatar_color || '#185FA5'}
                size={28}
                online
              />
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginLeft: '-8px',
            }}>
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {loading ? (
          <div style={styles.centerMsg}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.centerMsg}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)' }}>
              Be the first to say something in <strong style={{ color: 'rgba(255,255,255,0.7)' }}>#{room?.name}</strong>
            </div>
          </div>
        ) : (
          grouped.map((item, i) =>
            item.type === 'date' ? (
              <div key={`date-${i}`} style={styles.dateSep}>
                <div style={styles.dateLine} />
                <span style={styles.dateLabel}>{item.label}</span>
                <div style={styles.dateLine} />
              </div>
            ) : (
              <MessageBubble
                key={item.msg.id}
                msg={item.msg}
                isMine={item.msg.sender_id === user?.id}
                onReply={setReplyTo}
                onReact={toggleReaction}
                currentUserId={user?.id}
              />
            )
          )
        )}
        <TypingIndicator users={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div style={styles.replyBar}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#378ADD', fontWeight: '600' }}>
              Replying to {replyTo.sender?.display_name}
            </span>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
              {replyTo.content}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputWrap}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            placeholder={`Message #${room?.name || '...'}`}
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value)
              handleTyping()
              // Auto-resize
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', padding: '4px 4px 0', textAlign: 'right' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}

const styles = {
  area: {
    flex: 1, display: 'flex', flexDirection: 'column', height: '100%',
    background: '#111827', fontFamily: "'DM Sans', sans-serif", minWidth: 0,
  },
  header: {
    padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#0f1724',
  },
  roomIcon: {
    width: 36, height: 36, borderRadius: '10px',
    background: 'rgba(24,95,165,0.2)', border: '1px solid rgba(24,95,165,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', color: '#378ADD', fontWeight: '600',
  },
  roomName: { fontSize: '15px', fontWeight: '600', color: '#fff' },
  roomMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' },
  messages: {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  centerMsg: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center',
    padding: '40px',
  },
  dateSep: {
    display: 'flex', alignItems: 'center', gap: '12px',
    margin: '16px 0 8px',
  },
  dateLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' },
  dateLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', fontWeight: '500' },
  replyBar: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '8px 20px', background: 'rgba(24,95,165,0.1)',
    borderTop: '1px solid rgba(24,95,165,0.2)',
    borderLeft: '3px solid #185FA5',
  },
  inputArea: { padding: '10px 16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  inputWrap: {
    display: 'flex', alignItems: 'flex-end', gap: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px', padding: '8px 8px 8px 16px',
  },
  textarea: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#fff', fontSize: '14px', lineHeight: '1.5', resize: 'none',
    fontFamily: "'DM Sans', sans-serif", maxHeight: '120px', overflowY: 'auto',
    paddingTop: '2px',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: '10px', background: '#185FA5',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s',
  },
}
