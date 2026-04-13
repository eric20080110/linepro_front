import Avatar from '../Common/Avatar'
import { useTheme } from '../../theme/ThemeContext'
import { format } from 'date-fns'

/**
 * isLastMyMsg  — true when this is the last message sent by me (shows 已讀)
 * readCount    — for DM: 1 if partner has read, 0 if not; for group: number of readers excluding sender
 */
export default function MessageBubble({ msg, sender, isMe, showAvatar, isLastMyMsg, readCount, onImageClick }) {
  const theme = useTheme()
  const time = format(new Date(msg.timestamp || msg.createdAt), 'HH:mm')
  const isVideo = msg.mediaUrl?.match(/\.(mp4|webm|ogg|mov)$/i) && !msg.mediaUrl?.includes('chat-audio')
  const isAudio = msg.mediaUrl?.includes('chat-audio')

  const bubbleOtherBg     = theme.isDark ? (theme.bubbleOther   || '#2d2d2d') : 'white'
  const bubbleOtherText   = theme.isDark ? (theme.bubbleOtherText || '#f0f0f0') : '#1a1a1a'
  const bubbleOtherBorder = theme.isDark ? (theme.bubbleOtherBorder || '#3a3a3a') : '#e5e7eb'

  return (
    <div 
      id={`msg-${msg._id}`}
      style={{
        display: 'flex',
        flexDirection: isMe ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: isLastMyMsg ? 4 : 8,
        padding: '4px 8px',
        borderRadius: 8,
        transition: 'background-color 0.5s',
      }}
    >
      {showAvatar && !isMe && <Avatar user={sender} size={32} />}
      {showAvatar && isMe  && <div style={{ width: 32 }} />}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '65%',
      }}>
        {showAvatar && !isMe && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 3, paddingLeft: 4 }}>
            {sender?.nickname || sender?.name}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
          {/* Bubble */}
          <div style={{
            padding: msg.mediaUrl && !msg.text ? 4 : '10px 14px',
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMe ? theme.bubbleMe : bubbleOtherBg,
            color: isMe ? theme.bubbleMeText : bubbleOtherText,
            fontSize: 15,
            lineHeight: '1.5',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            border: isMe ? 'none' : `1px solid ${bubbleOtherBorder}`,
            overflow: 'hidden',
          }}>
            {msg.mediaUrl && (
              isAudio ? (
                <audio
                  controls
                  src={msg.mediaUrl}
                  style={{
                    display: 'block',
                    maxWidth: 240,
                    margin: msg.text ? '0 0 8px 0' : 0,
                  }}
                />
              ) : isVideo ? (
                <div
                  onClick={() => onImageClick && onImageClick({ url: msg.mediaUrl, type: 'video' })}
                  style={{ cursor: 'zoom-in' }}
                >
                  <video
                    src={msg.mediaUrl}
                    style={{
                      display: 'block',
                      maxWidth: 260,
                      maxHeight: 280,
                      borderRadius: msg.text ? '10px 10px 0 0' : 10,
                      objectFit: 'cover',
                      pointerEvents: 'none', // let the div handle the click
                    }}
                  />
                  {/* Play icon overlay indicator could go here if wanted */}
                </div>
              ) : (
                <div
                  onClick={() => onImageClick && onImageClick({ url: msg.mediaUrl, type: 'image' })}
                  style={{ cursor: 'zoom-in' }}
                >
                  <img
                    src={msg.mediaUrl}
                    alt="圖片"
                    style={{
                      display: 'block',
                      maxWidth: 260,
                      maxHeight: 280,
                      borderRadius: msg.text ? '10px 10px 0 0' : 10,
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )
            )}
            {msg.text && (
              <span style={{ display: 'block', padding: msg.mediaUrl ? '8px 10px 6px' : 0 }}>
                {msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                  if (part.match(/^https?:\/\/[^\s]+$/)) {
                    return (
                      <a 
                        key={i} 
                        href={part} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: isMe ? '#fff' : (theme.primary || '#06C755'), textDecoration: 'underline', wordBreak: 'break-all' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {part}
                      </a>
                    )
                  }
                  return part
                })}
              </span>
            )}
          </div>

          {/* Time */}
          <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, paddingBottom: 2 }}>
            {time}
          </div>
        </div>

        {/* 已讀 indicator — only on last sent message */}
        {isMe && isLastMyMsg && (
          <div style={{
            fontSize: 11,
            color: readCount > 0 ? theme.primary : '#9ca3af',
            marginTop: 3,
            paddingRight: 2,
            fontWeight: readCount > 0 ? 600 : 400,
          }}>
            {readCount > 0
              ? (showAvatar ? `已讀 ${readCount}` : '已讀')
              : '已傳送'}
          </div>
        )}
      </div>
    </div>
  )
}
