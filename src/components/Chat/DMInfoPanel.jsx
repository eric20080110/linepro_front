import { useState } from 'react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'
import Icon from '../Common/Icon'
import ImagePreviewModal from './ImagePreviewModal'

export default function DMInfoPanel({ user, onClose }) {
  const { getMessages, jumpToMessage } = useStore()
  const theme = useTheme()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('media') // 'media', 'links', 'search'
  const [searchQuery, setSearchQuery] = useState('')
  const [previewMedia, setPreviewMedia] = useState(null)
  const messages = getMessages()

  const textPrimary = theme.isDark ? '#f0f0f0' : '#1a1a1a'
  const textSecondary = theme.isDark ? '#9ca3af' : '#6b7280'
  const borderColor = theme.isDark ? '#333' : '#e5e7eb'
  const cardBg = theme.isDark ? theme.cardBg : 'white'

  return (
    <div style={{
      position: isMobile ? 'absolute' : 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: cardBg,
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        width: isMobile ? '100%' : 400,
        maxHeight: isMobile ? '92%' : '80vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '32px 24px 24px', textAlign: 'center',
          background: theme.sidebarHeaderGradient || 'linear-gradient(135deg, #f9fafb, #f3f4f6)', 
          borderBottom: `1px solid ${borderColor}`
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 20,
            background: 'rgba(0,0,0,0.1)', color: textSecondary,
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>×</button>
          
          <Avatar user={user} size={80} style={{ margin: '0 auto 16px', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          
          <h3 style={{ fontSize: 22, fontWeight: 700, color: theme.isDark ? '#fff' : '#1a1a1a', marginBottom: 4 }}>{user.nickname || user.name}</h3>
          <p style={{ fontSize: 14, color: textSecondary }}>{user.statusMessage || '沒有狀態訊息'}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
          <button
            onClick={() => setActiveTab('media')}
            style={{
              flex: 1, padding: '12px 0', background: 'none',
              fontWeight: activeTab === 'media' ? 700 : 500,
              color: activeTab === 'media' ? (theme.primary || '#06C755') : textSecondary,
              borderBottom: activeTab === 'media' ? `3px solid ${theme.primary || '#06C755'}` : '3px solid transparent',
              fontSize: 14, transition: 'all 0.2s',
            }}
          >媒體檔案</button>
          <button
            onClick={() => setActiveTab('links')}
            style={{
              flex: 1, padding: '12px 0', background: 'none',
              fontWeight: activeTab === 'links' ? 700 : 500,
              color: activeTab === 'links' ? (theme.primary || '#06C755') : textSecondary,
              borderBottom: activeTab === 'links' ? `3px solid ${theme.primary || '#06C755'}` : '3px solid transparent',
              fontSize: 14, transition: 'all 0.2s',
            }}
          >連結</button>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1, padding: '12px 0', background: 'none',
              fontWeight: activeTab === 'search' ? 700 : 500,
              color: activeTab === 'search' ? (theme.primary || '#06C755') : textSecondary,
              borderBottom: activeTab === 'search' ? `3px solid ${theme.primary || '#06C755'}` : '3px solid transparent',
              fontSize: 14, transition: 'all 0.2s',
            }}
          >搜尋訊息</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: cardBg }}>
          {activeTab === 'media' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {messages.filter(m => m.mediaUrl && !m.mediaUrl.includes('chat-audio')).map((m, i) => {
                  const isVideo = m.mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
                  return (
                    <div 
                      key={m._id || i} 
                      onClick={() => setPreviewMedia({ url: m.mediaUrl, type: isVideo ? 'video' : 'image' })}
                      style={{ aspectRatio: '1/1', background: (theme.isDark ? '#2d2d2d' : '#f3f4f6'), borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}
                    >
                      {isVideo ? (
                        <video src={m.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={m.mediaUrl} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  )
                })}
                {messages.filter(m => m.mediaUrl && !m.mediaUrl.includes('chat-audio')).length === 0 && (
                  <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px 0', color: textSecondary, fontSize: 14 }}>
                    尚無照片或影片
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.filter(m => m.text?.match(/https?:\/\/[^\s]+/)).map((m, i) => {
                  const urls = m.text.match(/https?:\/\/[^\s]+/g)
                  return urls.map((url, j) => (
                    <div key={`${m._id}-${i}-${j}`} style={{ padding: '12px', background: (theme.isDark ? '#2d2d2d' : '#f9fafb'), borderRadius: 10, border: `1px solid ${borderColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: (theme.primary || '#06C755') }}>
                          {m.senderId?._id === user._id ? (user.nickname || user.name) : '我'}
                        </span>
                        <span 
                          onClick={() => { jumpToMessage(m._id); onClose() }}
                          style={{ fontSize: 10, color: textSecondary, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          查看訊息
                        </span>
                      </div>
                      <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: (theme.isDark ? '#60a5fa' : '#2563eb'), wordBreak: 'break-all', textDecoration: 'none' }}>
                        {url}
                      </a>
                    </div>
                  ))
                })}
                {messages.filter(m => m.text?.match(/https?:\/\/[^\s]+/)).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: textSecondary, fontSize: 14 }}>
                    尚無共享連結
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div style={{ padding: '16px' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋訊息內容..."
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 20,
                  border: `1.5px solid ${borderColor}`, fontSize: 14, marginBottom: 16,
                  background: (theme.isDark ? '#2d2d2d' : '#f9fafb'),
                  color: textPrimary
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.filter(m => searchQuery && m.text?.toLowerCase().includes(searchQuery.toLowerCase())).map((m, i) => (
                  <div 
                    key={m._id || i} 
                    onClick={() => { jumpToMessage(m._id); onClose() }}
                    style={{ padding: '12px', background: (theme.isDark ? '#2d2d2d' : '#f9fafb'), borderRadius: 10, border: `1px solid ${borderColor}`, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: (theme.primary || '#06C755') }}>
                        {m.senderId?._id === user._id ? (user.nickname || user.name) : '我'}
                      </span>
                      <span style={{ fontSize: 10, color: textSecondary }}>
                        {new Date(m.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: textPrimary, lineHeight: '1.4' }}>{m.text}</div>
                  </div>
                ))}
                {searchQuery && messages.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: textSecondary, fontSize: 14 }}>
                    找不到符合條件的訊息
                  </div>
                )}
                {!searchQuery && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: textSecondary, fontSize: 14 }}>
                    <Icon name="search" fallback="🔍" size={32} style={{ filter: 'grayscale(1) opacity(0.3)', marginBottom: 8 }} /><br/>
                    輸入關鍵字開始搜尋
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {previewMedia && (
        <ImagePreviewModal url={previewMedia.url} type={previewMedia.type} onClose={() => setPreviewMedia(null)} />
      )}
    </div>
  )
}
