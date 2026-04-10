export default function Avatar({ name = '?', color = '#185FA5', size = 36, online = false }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Derive a lighter bg from the color
  const bg = color + '22'
  const border = color + '55'

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        border: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: '600',
        color: color,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
      }}>
        {initials}
      </div>
      {online && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: '50%',
          background: '#1D9E75',
          border: '2px solid #0a0f1a',
        }} />
      )}
    </div>
  )
}
