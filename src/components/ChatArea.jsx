import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import Avatar from './Avatar'
import MessageInput from './MessageInput'

function dateSeparator(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

export default function ChatArea({ roomId, rooms }) {
  const { user } = useAuth()
  const { messages, loading, typingUsers, onlineUsers, sendMessage, handleTyping, toggleReaction } = useMessages(roomId)
  const [replyTo, setReplyTo] = useState(null)
  const bottomRef = useRef(null)

  const room = rooms?.find(r => r.id === roomId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages, typingUsers])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages, typingUsers])

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

      <MessageInput 
        roomName={room?.name} 
        sendMessage={sendMessage} 
        handleTyping={handleTyping} 
        replyTo={replyTo} 
        setReplyTo={setReplyTo} 
      />
    </div>
  )
}

const styles = {
  area: {
    flex: 1, display: 'flex', flexDirection: 'column', height: '100%',
    background: '#0b141a', fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", minWidth: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h10v10H10zM30 30h10v10H30zM50 10h10v10H50zM70 30h10v10H70zM10 50h10v10H10zM30 70h10v10H30zM50 50h10v10H50zM70 70h10v10H70zM90 10h10v10H90zM90 50h10v10H90z' fill='rgba(255,255,255,0.02)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  },
  header: {
    padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#202c33', borderBottom: '1px solid rgba(255,255,255,0.02)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 10, minHeight: '59px',
  },
  roomName: { fontSize: '16px', fontWeight: '500', color: '#e9edef' },
  roomMeta: { fontSize: '13px', color: '#8696a0', marginTop: '1px' },
  messages: {
    flex: 1, overflowY: 'auto', padding: '20px 5%',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  centerMsg: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center',
    padding: '40px',
  },
  dateSep: {
    display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center',
    margin: '12px 0',
  },
  dateLine: { display: 'none' },
  dateLabel: { 
    fontSize: '12.5px', color: '#8696a0', background: '#202c33', 
    padding: '6px 12px', borderRadius: '8px', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)' 
  },
  dateLabel: { 
    fontSize: '12.5px', color: '#8696a0', background: '#202c33', 
    padding: '6px 12px', borderRadius: '8px', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)' 
  },
}
