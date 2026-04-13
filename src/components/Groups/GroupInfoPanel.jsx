import { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'
import Icon from '../Common/Icon'
import { uploadToCloudinary } from '../../utils/cloudinaryUpload'
import ImagePreviewModal from '../Chat/ImagePreviewModal'

export default function GroupInfoPanel({ group: initialGroup, onClose }) {
  const { currentUser, friends, groups, addGroupMembers, leaveGroup, updateGroupProfile, setActiveChat, getMessages } = useStore()
  const isMobile = useIsMobile()
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [adding, setAdding] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)
  
  const [activeTab, setActiveTab] = useState('members') // 'members', 'media', 'search'
  const [searchQuery, setSearchQuery] = useState('')
  const [previewMedia, setPreviewMedia] = useState(null)
  const messages = getMessages()

  const handleAvatarClick = () => {
    if (isAdmin) fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const url = await uploadToCloudinary(file, 'avatars')
      await updateGroupProfile(group._id, { avatarUrl: url })
    } catch (err) {
      console.error('group avatar upload failed:', err)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  // Get fresh group from store
  const group = groups.find(g => g._id === initialGroup._id) || initialGroup
  const members = Array.isArray(group.members) ? group.members : []
  const isAdmin = (group.admins || []).some(aId => String(aId) === String(currentUser._id)) || String(group.createdBy) === String(currentUser._id)

  const memberIds = new Set(members.map(m => m._id || m))
  const nonMembers = friends.filter(f => !memberIds.has(f._id))

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleAdd = async () => {
    if (selectedIds.length === 0) return
    setAdding(true)
    try {
      await addGroupMembers(group._id, selectedIds)
      setSelectedIds([])
      setShowAddMember(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleLeave = async () => {
    await leaveGroup(group._id)
    setActiveChat(null)
    onClose()
  }

  const getMemberUser = (m) => {
    if (typeof m === 'object' && (m.nickname || m.name)) return m
    return null
  }

  return (
    <div style={{
      position: isMobile ? 'absolute' : 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        width: isMobile ? '100%' : 400,
        maxHeight: isMobile ? '92%' : '80vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '24px', textAlign: 'center',
          background: 'linear-gradient(135deg, #06C755, #00a843)', color: 'white',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 20,
            background: 'rgba(255,255,255,0.2)', color: 'white',
            borderRadius: '50%', width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>×</button>
          <div 
            style={{
              position: 'relative', display: 'inline-block', margin: '0 auto 12px',
              cursor: isAdmin ? 'pointer' : 'default',
            }}
            onClick={handleAvatarClick}
            title={isAdmin ? "點擊更換群組圖片" : ""}
          >
            <Avatar user={group} size={64} style={{ border: '3px solid rgba(255,255,255,0.4)' }} />
            {uploadingAvatar && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="loading" fallback="⏳" size={24} className="animate-spin" style={{ filter: 'brightness(0) invert(1)' }} /></div>
            )}
            {!uploadingAvatar && isAdmin && (
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: '#06C755', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="camera" fallback="📷" size={14} style={{ filter: 'brightness(0) invert(1)' }} /></div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{group.name}</h3>
          {group.description && <p style={{ fontSize: 13, opacity: 0.85 }}>{group.description}</p>}
          <p style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{members.length} 位成員</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              flex: 1, padding: '12px 0', background: 'none',
              fontWeight: activeTab === 'members' ? 700 : 500,
              color: activeTab === 'members' ? '#06C755' : '#6b7280',
              borderBottom: activeTab === 'members' ? '3px solid #06C755' : '3px solid transparent',
              fontSize: 14, transition: 'all 0.2s',
            }}
          >成員</button>
          <button
            onClick={() => setActiveTab('media')}
            style={{
              flex: 1, padding: '12px 0', background: 'none',
              fontWeight: activeTab === 'media' ? 700 : 500,
              color: activeTab === 'media' ? '#06C755' : '#6b7280',
              borderBottom: activeTab === 'media' ? '3px solid #06C755' : '3px solid transparent',
              fontSize: 14, transition: 'all 0.2s',
            }}
          >媒體</button>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1, padding: '12px 0', background: 'none',
              fontWeight: activeTab === 'search' ? 700 : 500,
              color: activeTab === 'search' ? '#06C755' : '#6b7280',
              borderBottom: activeTab === 'search' ? '3px solid #06C755' : '3px solid transparent',
              fontSize: 14, transition: 'all 0.2s',
            }}
          >搜尋</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'members' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 8px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>成員列表</span>
                {!showAddMember && nonMembers.length > 0 && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    style={{ fontSize: 12, fontWeight: 600, color: '#06C755', background: 'none', padding: '4px 8px' }}
                  >
                    + 邀請成員
                  </button>
                )}
              </div>

              {showAddMember && (
                <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>邀請好友加入群組</div>
                  {nonMembers.map(f => {
                    const sel = selectedIds.includes(f._id)
                    return (
                      <button
                        key={f._id}
                        onClick={() => toggleSelect(f._id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 0', background: 'none', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 5,
                          border: sel ? '2px solid #06C755' : '2px solid #d1d5db',
                          background: sel ? '#06C755' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {sel && '✓'}
                        </div>
                        <Avatar user={f} size={32} />
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{f.nickname || f.name}</span>
                      </button>
                    )
                  })}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={handleAdd}
                      disabled={selectedIds.length === 0 || adding}
                      style={{
                        flex: 1, padding: '9px', borderRadius: 8,
                        background: selectedIds.length > 0 ? '#06C755' : '#e5e7eb',
                        color: selectedIds.length > 0 ? 'white' : '#9ca3af',
                        fontSize: 13, fontWeight: 700,
                      }}
                    >
                      {adding ? '邀請中...' : '確認邀請'}
                    </button>
                    <button
                      onClick={() => { setShowAddMember(false); setSelectedIds([]) }}
                      style={{ padding: '9px 16px', borderRadius: 8, background: '#f3f4f6', color: '#374151', fontSize: 13 }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {members.map((member, i) => {
                const m = getMemberUser(member)
                if (!m) return null
                const adminIds = (group.admins || []).map(a => a._id || a)
                const isAdminMember = adminIds.includes(m._id)
                const isMe = m._id === currentUser._id
                return (
                  <div key={m._id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                  }}>
                    <Avatar user={m} size={40} showStatus />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{m.nickname || m.name}</span>
                        {isAdminMember && (
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>管理員</span>
                        )}
                        {isMe && (
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>我</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {m.status === 'online' ? '線上' : '離線'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {activeTab === 'media' && (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 12 }}>群組媒體檔案</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {messages.filter(m => m.mediaUrl && !m.mediaUrl.includes('chat-audio')).map((m, i) => {
                  const isVideo = m.mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
                  return (
                    <div 
                      key={m._id || i} 
                      onClick={() => setPreviewMedia({ url: m.mediaUrl, type: isVideo ? 'video' : 'image' })}
                      style={{ aspectRatio: '1/1', background: '#f3f4f6', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}
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
                  <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
                    尚無照片或影片
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div style={{ padding: '12px 16px' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋訊息內容..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 20,
                  border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 16
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.filter(m => searchQuery && m.text?.toLowerCase().includes(searchQuery.toLowerCase())).map((m, i) => (
                  <div 
                    key={m._id || i} 
                    onClick={() => { jumpToMessage(m._id); onClose() }}
                    style={{ padding: '10px', background: '#f9fafb', borderRadius: 8, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#06C755' }}>
                        {m.senderId?.nickname || m.senderId?.name}
                      </span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>
                        {new Date(m.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#1a1a1a' }}>{m.text}</div>
                  </div>
                ))}
                {searchQuery && messages.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
                    找不到符合條件的訊息
                  </div>
                )}
                {!searchQuery && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
                    輸入關鍵字開始搜尋
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={handleLeave}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: '#fff0f0', color: '#ef4444', fontSize: 15, fontWeight: 700,
            }}
          >
            離開群組
          </button>
        </div>
      </div>

      {previewMedia && (
        <ImagePreviewModal url={previewMedia.url} type={previewMedia.type} onClose={() => setPreviewMedia(null)} />
      )}
    </div>
  )
}
