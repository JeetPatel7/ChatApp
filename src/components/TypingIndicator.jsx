export default function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null

  const text = users.length === 1
    ? `${users[0]} is typing`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing`
    : `${users[0]} and ${users.length - 1} others are typing`

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 16px 8px',
      minHeight: '28px',
    }}>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.35)',
              animation: 'typingBounce 1.2s infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
        {text}...
      </span>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-4px); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
