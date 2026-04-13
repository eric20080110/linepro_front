import { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'
import { uploadToCloudinary } from '../../utils/cloudinaryUpload'

export default function ProfilePanel({ onClose }) {
  const { currentUser, updateProfile } = useStore()
  const isMobile = useIsMobile()
  const [name, setName] = useState(currentUser?.name || '')
  const [nickname, setNickname] = useState(currentUser?.nickname || '')
  const [statusMsg, setStatusMsg] = useState(currentUser?.statusMessage || '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const url = await uploadToCloudinary(file, 'avatars')
      await updateProfile({ avatarUrl: url })
    } catch (err) {
      console.error('avatar upload failed:', err)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ name, nickname, statusMessage: statusMsg })
      onClose()
    } finally {
      setSaving(false)
    }
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
        padding: 32,
        width: isMobile ? '100%' : 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{ display: 'inline-block', position: 'relative', cursor: 'pointer' }}
            onClick={handleAvatarClick}
            title="點擊更換大頭貼"
          >
            <Avatar user={currentUser} size={80} showStatus />
            {uploadingAvatar && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 20,
              }}><span className="animate-spin">⏳</span></div>
            )}
            {!uploadingAvatar && (
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: '#06C755', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: 'white',
              }}>📷</div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <h2 style={{ marginTop: 12, fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{currentUser?.nickname || currentUser?.name}</h2>
          <span style={{
            display: 'inline-block', marginTop: 6,
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: currentUser?.status === 'online' ? '#dcfce7' : '#f3f4f6',
            color: currentUser?.status === 'online' ? '#16a34a' : '#6b7280',
          }}>
            {currentUser?.status === 'online' ? '線上' : '離線'}
          </span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
            暱稱
          </label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="輸入您的暱稱..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1.5px solid #e5e7eb', fontSize: 14,
            }}
            onFocus={e => e.target.style.borderColor = '#06C755'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
            顯示名稱 (真實姓名)
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1.5px solid #e5e7eb', fontSize: 14,
            }}
            onFocus={e => e.target.style.borderColor = '#06C755'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
            電子郵件
          </label>
          <div style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 14, color: '#374151' }}>
            {currentUser?.email}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
            狀態訊息
          </label>
          <input
            value={statusMsg}
            onChange={e => setStatusMsg(e.target.value)}
            placeholder="輸入您的狀態訊息..."
            maxLength={50}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1.5px solid #e5e7eb', fontSize: 14,
            }}
            onFocus={e => e.target.style.borderColor = '#06C755'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: '#06C755', color: 'white', fontSize: 15, fontWeight: 700,
            }}
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px', borderRadius: 10,
              background: '#f3f4f6', color: '#374151', fontSize: 15,
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
