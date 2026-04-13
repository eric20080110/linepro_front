import { useEffect } from 'react'
import { io } from 'socket.io-client'
import useStore from '../store/useStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useSocket(mongoUserId) {
  useEffect(() => {
    if (!mongoUserId) return

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const socket = io(API_URL, {
      auth: { userId: mongoUserId },
      transports: ['websocket', 'polling'],
    })

    // Store socket reference so setActiveChat can join rooms
    useStore.getState().setSocket(socket)

    socket.on('new_message', (message) => {
      useStore.getState().appendMessage(message)

      // System notification logic
      const currentUser = useStore.getState().currentUser
      const isFromMe = (message.senderId?._id || message.senderId) === currentUser?._id
      
      if (!isFromMe && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
        const senderName = message.senderId?.nickname || message.senderId?.name || '新訊息'
        new Notification(`LinePro: ${senderName}`, {
          body: message.text || (message.mediaUrl ? '傳送了媒體檔案' : ''),
          icon: '/favicon.svg'
        })
      }
    })

    socket.on('messages_read', (payload) => {
      useStore.getState().handleMessagesRead(payload)
    })

    socket.on('friend_request_received', ({ from }) => {
      useStore.getState().addIncomingRequest(from)
    })

    socket.on('friend_accepted', ({ friend }) => {
      useStore.getState().addFriendToList(friend)
    })

    socket.on('status_changed', ({ userId, status }) => {
      useStore.getState().updateFriendStatus(userId, status)
    })

    socket.on('group_updated', ({ group }) => {
      useStore.getState().updateGroupInList(group)
    })

    socket.on('member_left', ({ groupId, userId }) => {
      useStore.getState().handleMemberLeft(groupId, userId)
    })

    socket.on('incoming_call', (payload) => {
      useStore.getState().setIncomingCall(payload)
    })

    socket.on('call_rejected', () => {
      useStore.getState().setActiveCall(null)
    })

    return () => {
      socket.disconnect()
      useStore.getState().setSocket(null)
    }
  }, [mongoUserId])
}
