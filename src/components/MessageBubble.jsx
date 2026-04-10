import { useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import Avatar from './Avatar'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '👏']

function formatTime(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a')
  return format(d, 'MMM d, h:mm a')
}

function groupReactions(reactions = []) {
  const map = {}
  reactions.forEach(r => {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [] }
    map[r.emoji].count++
    map[r.emoji].users.push(r.profiles?.display_name || 'Someone')
  })
  return Object.entries(map).map(([emoji, data]) => ({ emoji, ...data }))
}

export default function MessageBubble({ msg, isMine, onReply, onReact, currentUserId }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [hovered, setHovered] = useState(false)
  const grouped = groupReactions(msg.reactions)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
        marginBottom: '4px',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmojiPicker(false) }}
    >
      {/* Avatar */}
      {!isMine && (
        <Avatar
          name={msg.sender?.display_name || '?'}
          color={msg.sender?.avatar_color || '#185FA5'}
          size={28}
        />
      )}

      <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
        {/* Sender name (group chats) */}
        {!isMine && (
          <span style={{ fontSize: '11px', fontWeight: '600', color: msg.sender?.avatar_color || '#378ADD', marginBottom: '3px', paddingLeft: '2px' }}>
            {msg.sender?.display_name}
          </span>
        )}

        {/* Reply preview */}
        {msg.reply_to && (
          <div style={{
            borderLeft: `2px solid ${isMine ? 'rgba(255,255,255,0.4)' : '#378ADD'}`,
            paddingLeft: '8px',
            marginBottom: '5px',
            maxWidth: '100%',
          }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: isMine ? 'rgba(255,255,255,0.6)' : '#378ADD' }}>
              {msg.reply_to.sender?.display_name}
            </div>
            <div style={{ fontSize: '12px', color: isMine ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
              {msg.reply_to.content}
            </div>
          </div>
        )}

        {/* Bubble */}
        <div style={{
          background: isMine ? '#005c4b' : '#202c33',
          border: 'none',
          borderRadius: isMine ? '8px 0 8px 8px' : '0 8px 8px 8px',
          padding: '6px 7px 8px 9px',
          fontSize: '14px',
          lineHeight: '19px',
          color: '#e9edef',
          wordBreak: 'break-word',
          position: 'relative',
          minWidth: '100px',
          boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
        }}>
          {/* WhatsApp Tail */}
          <div style={{
            position: 'absolute', top: 0,
            [isMine ? 'right' : 'left']: '-8px',
            width: '8px', height: '13px',
            background: isMine ? '#005c4b' : '#202c33',
            clipPath: isMine ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)',
          }}/>
          
          <div style={{ paddingBottom: '14px' }}>
            {msg.content}
          </div>
          
          <div style={{
            position: 'absolute', right: '7px', bottom: '2px',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
              {formatTime(msg.created_at)}
            </span>
            {isMine && (
              <span style={{ fontSize: '13px', color: msg.pending ? '#8696a0' : '#53bdeb' }}>
                {msg.pending ? '🕒' : '✓✓'}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {grouped.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
            {grouped.map(({ emoji, count, users }) => (
              <button
                key={emoji}
                title={users.join(', ')}
                onClick={() => onReact(msg.id, emoji)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {emoji} <span style={{ fontSize: '11px', opacity: 0.8 }}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover action buttons */}
      {hovered && (
        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          position: 'absolute',
          [isMine ? 'left' : 'right']: isMine ? '36px' : '36px',
          bottom: '8px',
          zIndex: 10,
        }}>
          {/* Emoji picker toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowEmojiPicker(p => !p)}
              style={actionBtnStyle}
              title="React"
            >
              😊
            </button>
            {showEmojiPicker && (
              <div style={{
                position: 'absolute',
                bottom: '36px',
                [isMine ? 'right' : 'left']: '0',
                background: '#233138',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                gap: '6px',
                zIndex: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {QUICK_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => { onReact(msg.id, e); setShowEmojiPicker(false) }}
                    style={{ ...actionBtnStyle, fontSize: '18px', width: '32px', height: '32px' }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Reply */}
          <button onClick={() => onReply(msg)} style={actionBtnStyle} title="Reply">
            ↩
          </button>
        </div>
      )}
    </div>
  )
}

const actionBtnStyle = {
  background: '#202c33',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '8px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '15px',
  color: '#8696a0',
  fontFamily: "inherit",
}
