import { useState, useRef, useEffect } from 'react'
import EmojiPicker, { Theme } from 'emoji-picker-react'

export default function MessageInput({ roomName, sendMessage, handleTyping, replyTo, setReplyTo }) {
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const inputRef = useRef(null)

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSend() {
    if (!input.trim()) return
    const textToSend = input
    const replyId = replyTo?.id
    
    setInput('')
    setReplyTo(null)
    setShowEmoji(false)
    
    // Auto-reset height
    if (inputRef.current) inputRef.current.style.height = 'auto'
    
    sendMessage(textToSend, replyId)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function onEmojiClick(emojiObject) {
    setInput(prev => prev + emojiObject.emoji)
  }

  return (
    <div style={styles.inputArea}>
      {/* Reply preview */}
      {replyTo && (
        <div style={styles.replyBar}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#00a884', fontWeight: '600' }}>
              Replying to {replyTo.sender?.display_name}
            </span>
            <div style={{ fontSize: '12px', color: '#8696a0', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
              {replyTo.content}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      {/* Main Bar */}
      <div style={styles.inputContainer}>
        {/* Emoji Toggle */}
        <div style={{ position: 'relative' }}>
          <button 
            style={styles.iconBtn} 
            onClick={() => setShowEmoji(prev => !prev)}
            title="Emojis"
          >
            <svg viewBox="0 0 24 24" height="26" width="26" preserveAspectRatio="xMidYMid meet" fill="#aebac1"><path d="M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2z M12,20.5 c-4.687,0-8.5-3.813-8.5-8.5C3.5,7.313,7.313,3.5,12,3.5c4.687,0,8.5,3.813,8.5,8.5C20.5,16.687,16.687,20.5,12,20.5z M8.5,10 c-0.828,0-1.5,0.672-1.5,1.5S7.672,13,8.5,13s1.5-0.672,1.5-1.5S9.328,10,8.5,10z M15.5,10c-0.828,0-1.5,0.672-1.5,1.5 s0.672,1.5,1.5,1.5s1.5-0.672,1.5-1.5S16.328,10,15.5,10z M12,17c2.336,0,4.316-1.451,5.109-3.5H6.891 C7.684,15.549,9.664,17,12,17z"></path></svg>
          </button>
          
          {showEmoji && (
            <div style={styles.emojiPopup}>
              <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} searchDisabled={false} />
            </div>
          )}
        </div>

        <div style={styles.inputWrap}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            placeholder={`Message #${roomName || '...'}`}
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value)
              handleTyping()
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="#aebac1"><path d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path></svg>
        </button>
      </div>
    </div>
  )
}

const styles = {
  inputArea: {
    background: '#202c33',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  replyBar: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '8px 20px', background: '#202c33',
    borderLeft: '4px solid #00a884', borderBottom: '1px solid rgba(255,255,255,0.02)'
  },
  inputContainer: {
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
  },
  iconBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  emojiPopup: {
    position: 'absolute', bottom: '50px', left: '0', zIndex: 100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  inputWrap: {
    flex: 1, display: 'flex', alignItems: 'flex-end',
    background: '#2a3942', borderRadius: '8px', padding: '9px 12px',
  },
  textarea: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#d1d7db', fontSize: '15px', lineHeight: '20px', resize: 'none',
    fontFamily: "inherit", maxHeight: '120px', overflowY: 'auto',
  },
  sendBtn: {
    width: 40, height: 40, background: 'transparent',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s',
  },
}
