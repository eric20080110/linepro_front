import Avatar from '../Common/Avatar'
import { useTheme } from '../../theme/ThemeContext'
import { format } from 'date-fns'

export default function MessageBubble({ msg, sender, isMe, showAvatar }) {
  const theme = useTheme()
  const time = format(new Date(msg.timestamp || msg.createdAt), 'HH:mm')

  const bubbleOtherBg = theme.isDark ? (theme.bubbleOther || '#2d2d2d') : 'white'
  const bubbleOtherText = theme.isDark ? (theme.bubbleOtherText || '#f0f0f0') : '#1a1a1a'
  const bubbleOtherBorder = theme.isDark ? (theme.bubbleOtherBorder || '#3a3a3a') : '#e5e7eb'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 8,
    }}>
      {showAvatar && !isMe && <Avatar user={sender} size={32} />}
      {showAvatar && isMe && <div style={{ width: 32 }} />}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '65%',
      }}>
        {showAvatar && !isMe && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 3, paddingLeft: 4 }}>
            {sender?.name}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMe ? theme.bubbleMe : bubbleOtherBg,
            color: isMe ? theme.bubbleMeText : bubbleOtherText,
            fontSize: 15,
            lineHeight: '1.5',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            border: isMe ? 'none' : `1px solid ${bubbleOtherBorder}`,
          }}>
            {msg.text}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, paddingBottom: 2 }}>
            {time}
          </div>
        </div>
      </div>
    </div>
  )
}
