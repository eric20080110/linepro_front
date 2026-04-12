import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useStore from '../store/useStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useSocket(mongoUserId) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!mongoUserId) return

    const socket = io(API_URL, {
      auth: { userId: mongoUserId },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('new_message', (message) => {
      useStore.getState().appendMessage(message)
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

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [mongoUserId])

  return socketRef
}
