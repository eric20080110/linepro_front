export default function Avatar({ user, size = 40, showStatus = false }) {
  const statusColors = {
    online: '#22c55e',
    away: '#f59e0b',
    offline: '#9ca3af',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: user?.avatarColor || '#06C755',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}>
        {user?.name?.[0] || '?'}
      </div>
      {showStatus && (
        <div style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: '50%',
          background: statusColors[user?.status] || '#9ca3af',
          border: '2px solid white',
        }} />
      )}
    </div>
  )
}
