import { create } from 'zustand'
import { usersApi } from '../api/users'
import { friendsApi } from '../api/friends'
import { groupsApi } from '../api/groups'
import { messagesApi } from '../api/messages'
import { THEMES, DEFAULT_THEME } from '../theme/themes'

const getDMRoomId = (idA, idB) => {
  const sorted = [idA.toString(), idB.toString()].sort()
  return `dm:${sorted[0]}_${sorted[1]}`
}

const useStore = create((set, get) => ({
  // ─── Auth ────────────────────────────────────────────────────────────────
  currentUser: null,
  syncing: false,

  syncUser: async () => {
    set({ syncing: true })
    try {
      const user = await usersApi.sync()
      set({ currentUser: user, syncing: false })
      // Load initial data
      await Promise.all([
        get().fetchFriends(),
        get().fetchFriendRequests(),
        get().fetchGroups(),
      ])
      // Pre-fetch messages for all chats
      get().fetchAllMessages()
    } catch (err) {
      console.error('syncUser failed:', err)
      set({ syncing: false })
    }
  },

  updateProfile: async (data) => {
    const user = await usersApi.updateMe(data)
    set({ currentUser: user })
  },

  logout: () => {
    const { socket } = get()
    if (socket) socket.disconnect()
    set({
      currentUser: null,
      activeChat: null,
      friends: [],
      friendRequests: [],
      groups: [],
      messages: {},
      socket: null,
    })
  },

  // ─── Socket reference ────────────────────────────────────────────────────
  socket: null,
  setSocket: (socket) => set({ socket }),

  // ─── Call state ──────────────────────────────────────────────────────────
  incomingCall: null,   // { callerId, callerName, offer, callType }
  activeCall: null,     // { partnerId, partnerUser, mode: 'calling', callType }
  setIncomingCall: (call) => set({ incomingCall: call }),
  setActiveCall:   (call) => set({ activeCall: call }),

  // ─── Friends ─────────────────────────────────────────────────────────────
  friends: [],
  friendRequests: [],
  friendsLoading: false,

  fetchFriends: async () => {
    set({ friendsLoading: true })
    try {
      const friends = await friendsApi.list()
      set({ friends, friendsLoading: false })
    } catch (err) {
      console.error('fetchFriends failed:', err)
      set({ friendsLoading: false })
    }
  },

  fetchFriendRequests: async () => {
    try {
      const requests = await friendsApi.requests()
      set({ friendRequests: requests })
    } catch (err) {
      console.error('fetchFriendRequests failed:', err)
    }
  },

  sendFriendRequest: async (targetId) => {
    await friendsApi.sendRequest(targetId)
  },

  acceptFriendRequest: async (requesterId) => {
    await friendsApi.accept(requesterId)
    set(state => ({
      friendRequests: state.friendRequests.filter(u => u._id !== requesterId),
    }))
    await get().fetchFriends()
  },

  rejectFriendRequest: async (requesterId) => {
    await friendsApi.reject(requesterId)
    set(state => ({
      friendRequests: state.friendRequests.filter(u => u._id !== requesterId),
    }))
  },

  removeFriend: async (friendId) => {
    await friendsApi.remove(friendId)
    set(state => ({
      friends: state.friends.filter(f => f._id !== friendId),
    }))
  },

  // Socket-driven friend updates
  addIncomingRequest: (from) => {
    set(state => ({
      friendRequests: [...state.friendRequests.filter(r => r._id !== from._id), from],
    }))
  },

  addFriendToList: (friend) => {
    set(state => ({
      friends: [...state.friends.filter(f => f._id !== friend._id), friend],
    }))
  },

  updateFriendStatus: (userId, status) => {
    set(state => ({
      friends: state.friends.map(f =>
        f._id === userId ? { ...f, status } : f
      ),
    }))
  },

  // ─── Groups ──────────────────────────────────────────────────────────────
  groups: [],
  groupsLoading: false,

  fetchGroups: async () => {
    set({ groupsLoading: true })
    try {
      const groups = await groupsApi.list()
      set({ groups, groupsLoading: false })
    } catch (err) {
      console.error('fetchGroups failed:', err)
      set({ groupsLoading: false })
    }
  },

  createGroup: async (name, description, memberIds) => {
    const group = await groupsApi.create({ name, description, memberIds })
    set(state => ({ groups: [...state.groups, group] }))
    return group
  },

  leaveGroup: async (groupId) => {
    await groupsApi.leave(groupId)
    set(state => ({ groups: state.groups.filter(g => g._id !== groupId) }))
  },

  updateGroupProfile: async (groupId, data) => {
    const updated = await groupsApi.update(groupId, data)
    set(state => ({
      groups: state.groups.map(g => g._id === groupId ? updated : g),
    }))
  },

  addGroupMembers: async (groupId, memberIds) => {
    const updated = await groupsApi.addMembers(groupId, memberIds)
    set(state => ({
      groups: state.groups.map(g => g._id === groupId ? updated : g),
    }))
  },

  kickGroupMember: async (groupId, userId) => {
    await groupsApi.kickMember(groupId, userId)
    // List update will come via socket member_left
  },

  setGroupMemberAdmin: async (groupId, userId, isAdmin) => {
    const updated = await groupsApi.setMemberAdmin(groupId, userId, isAdmin)
    set(state => ({
      groups: state.groups.map(g => g._id === groupId ? updated : g),
    }))
  },

  updateGroupInList: (group) => {
    set(state => {
      if (!group) return state // Should not happen based on current backend but for safety
      return {
        groups: state.groups.map(g => g._id === group._id ? group : g),
      }
    })
  },

  handleMemberLeft: (groupId, userId) => {
    const { currentUser, activeChat } = get()
    if (userId === currentUser?._id) {
      set(state => ({ 
        groups: state.groups.filter(g => g._id !== groupId),
        activeChat: activeChat?.id === groupId ? null : activeChat
      }))
    } else {
      set(state => ({
        groups: state.groups.map(g =>
          g._id === groupId
            ? { ...g, members: g.members.filter(m => (m._id || m) !== userId) }
            : g
        ),
      }))
    }
  },

  // ─── Messages ────────────────────────────────────────────────────────────
  messages: {}, // { [chatKey]: Message[] }
  messagesLoading: false,
  activeChat: null,
  replyingTo: null, // Message object

  setReplyingTo: (message) => set({ replyingTo: message }),

  setActiveChat: async (chat) => {
    if (!chat) { set({ activeChat: null }); return }
    const { socket, currentUser } = get()

    // Join the socket room so we receive new_message events
    if (socket) {
      if (chat.type === 'dm') {
        socket.emit('join_dm', { partnerId: chat.id })
      } else {
        socket.emit('join_group', { groupId: chat.id })
      }
    }

    const key = chat.type === 'dm'
      ? getDMRoomId(currentUser._id, chat.id)
      : `group:${chat.id}`

    const alreadyHasMessages = !!get().messages[key]
    set({ activeChat: chat, messagesLoading: !alreadyHasMessages })

    try {
      let msgs = []
      if (chat.type === 'dm') {
        msgs = await messagesApi.getDM(chat.id)
      } else {
        msgs = await messagesApi.getGroup(chat.id)
      }
      set(state => ({
        messages: { ...state.messages, [key]: msgs },
        messagesLoading: false,
      }))

      // Mark messages as read after loading
      get().markMessagesRead(chat)
    } catch (err) {
      console.error('fetchMessages failed:', err)
      set({ messagesLoading: false })
    }
  },

  markMessagesRead: async (chat) => {
    const { currentUser } = get()
    if (!chat || !currentUser) return
    try {
      if (chat.type === 'dm') {
        await messagesApi.markDMRead(chat.id)
      } else {
        await messagesApi.markGroupRead(chat.id)
      }
      // Update local readBy state
      const key = chat.type === 'dm'
        ? getDMRoomId(currentUser._id, chat.id)
        : `group:${chat.id}`
      set(state => ({
        messages: {
          ...state.messages,
          [key]: (state.messages[key] || []).map(msg => {
            const senderId = msg.senderId?._id || msg.senderId
            if (senderId?.toString() !== currentUser._id?.toString()) {
              const alreadyRead = (msg.readBy || []).some(
                id => id?.toString() === currentUser._id?.toString()
              )
              if (!alreadyRead) {
                return { ...msg, readBy: [...(msg.readBy || []), currentUser._id] }
              }
            }
            return msg
          }),
        },
      }))
    } catch (_) { /* silent */ }
  },

  // Called via socket 'messages_read' event — update readBy on affected messages
  handleMessagesRead: ({ readerId, groupId, type }) => {
    const { currentUser } = get()
    if (!currentUser) return
    let key
    if (type === 'dm') {
      // The reader just read messages in their DM with us
      key = getDMRoomId(currentUser._id.toString(), readerId.toString())
    } else {
      key = `group:${groupId}`
    }
    set(state => ({
      messages: {
        ...state.messages,
        [key]: (state.messages[key] || []).map(msg => {
          const alreadyRead = (msg.readBy || []).some(
            id => id?.toString() === readerId?.toString()
          )
          if (!alreadyRead) {
            return { ...msg, readBy: [...(msg.readBy || []), readerId] }
          }
          return msg
        }),
      },
    }))
  },

  getMessages: () => {
    const { activeChat, messages, currentUser } = get()
    if (!activeChat) return []
    const key = activeChat.type === 'dm'
      ? getDMRoomId(currentUser._id, activeChat.id)
      : `group:${activeChat.id}`
    return messages[key] || []
  },

  sendMessage: async (text, mediaUrl = null) => {
    const { currentUser, activeChat, replyingTo } = get()
    if (!currentUser || !activeChat) return
    if (!text?.trim() && !mediaUrl) return

    const replyToId = replyingTo?._id
    set({ replyingTo: null }) // Clear reply state after sending

    if (activeChat.type === 'dm') {
      await messagesApi.sendDM(activeChat.id, text || '', mediaUrl, replyToId)
    } else {
      await messagesApi.sendGroup(activeChat.id, text || '', mediaUrl, replyToId)
    }
  },

  recallMessage: async (messageId) => {
    // Update locally first, then call API
    const patchAllKeys = (fn) => set(state => ({
      messages: Object.fromEntries(
        Object.entries(state.messages).map(([key, msgs]) => [key, msgs.map(fn)])
      ),
    }))
    patchAllKeys(m => (m._id || m.id) === messageId ? { ...m, isRecalled: true, text: '', mediaUrl: null } : m)
    try {
      await messagesApi.recall(messageId)
    } catch (err) {
      console.error('recallMessage failed:', err)
      // Revert
      patchAllKeys(m => (m._id || m.id) === messageId ? { ...m, isRecalled: false } : m)
    }
  },

  pinMessage: async (messageId, pinned) => {
    const patchAllKeys = (fn) => set(state => ({
      messages: Object.fromEntries(
        Object.entries(state.messages).map(([key, msgs]) => [key, msgs.map(fn)])
      ),
    }))
    patchAllKeys(m => (m._id || m.id) === messageId ? { ...m, isPinned: pinned } : m)
    try {
      await messagesApi.pin(messageId, pinned)
    } catch (err) {
      console.error('pinMessage failed:', err)
      patchAllKeys(m => (m._id || m.id) === messageId ? { ...m, isPinned: !pinned } : m)
    }
  },

  reactToMessage: async (messageId, emoji) => {
    await messagesApi.react(messageId, emoji)
  },

  updateMessageInStore: (updatedMsg) => {
    const { messages } = get()
    const msgId = updatedMsg._id || updatedMsg.id
    let key

    if (updatedMsg.type === 'dm') {
      const senderId = (updatedMsg.senderId?._id || updatedMsg.senderId || '').toString()
      const receiverId = (updatedMsg.receiverId?._id || updatedMsg.receiverId || '').toString()
      // Build the canonical DM key from both participants
      if (senderId && receiverId) {
        key = getDMRoomId(senderId, receiverId)
      } else {
        // Fallback: scan all DM keys for the message
        key = Object.keys(messages).find(k =>
          k.startsWith('dm:') && (messages[k] || []).some(m => (m._id || m.id) === msgId)
        )
      }
    } else {
      key = `group:${updatedMsg.groupId?._id || updatedMsg.groupId}`
    }

    if (!key) return

    set(state => ({
      messages: {
        ...state.messages,
        [key]: (state.messages[key] || []).map(m => {
          if ((m._id || m.id) !== msgId) return m
          const merged = { ...m, ...updatedMsg }
          // Once recalled, never un-recall (guard against stale socket events)
          if (m.isRecalled) { merged.isRecalled = true; merged.text = ''; merged.mediaUrl = null }
          return merged
        }),
      },
    }))
  },

  appendMessage: (message) => {
    let key
    if (message.type === 'dm') {
      const senderId = message.senderId?._id || message.senderId
      const receiverId = message.receiverId?._id || message.receiverId
      key = getDMRoomId(senderId, receiverId)
    } else {
      const groupId = message.groupId?._id || message.groupId
      key = `group:${groupId}`
    }
    set(state => ({
      messages: {
        ...state.messages,
        [key]: [...(state.messages[key] || []), message],
      },
    }))
  },

  getLastMessage: (chatId, type) => {
    const { messages, currentUser } = get()
    let key
    if (type === 'dm') {
      key = getDMRoomId(currentUser._id, chatId)
    } else {
      key = `group:${chatId}`
    }
    const msgs = messages[key] || []
    return msgs[msgs.length - 1] || null
  },

  fetchAllMessages: async () => {
    const { friends, groups, currentUser } = get()
    if (!currentUser) return

    const dmTasks = friends.map(async (f) => {
      try {
        const msgs = await messagesApi.getDM(f._id)
        const key = getDMRoomId(currentUser._id, f._id)
        set(state => ({ messages: { ...state.messages, [key]: msgs } }))
      } catch (e) { /* ignore */ }
    })

    const groupTasks = groups.map(async (g) => {
      try {
        const msgs = await messagesApi.getGroup(g._id)
        const key = `group:${g._id}`
        set(state => ({ messages: { ...state.messages, [key]: msgs } }))
      } catch (e) { /* ignore */ }
    })

    await Promise.all([...dmTasks, ...groupTasks])
  },

  // ─── Message Jumping ─────────────────────────────────────────────────────
  jumpToMessageId: null,
  jumpToMessage: (id) => {
    set({ jumpToMessageId: id })
    // Clear after a short delay so the same message can be jumped to again
    setTimeout(() => set({ jumpToMessageId: null }), 1000)
  },

  // ─── UI ──────────────────────────────────────────────────────────────────
  activeTab: 'chats',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ─── Theme ───────────────────────────────────────────────────────────────
  theme: (() => {
    const saved = localStorage.getItem('linepro_theme')
    return THEMES[saved] || DEFAULT_THEME
  })(),

  setTheme: (themeId) => {
    const theme = THEMES[themeId] || DEFAULT_THEME
    localStorage.setItem('linepro_theme', themeId)
    set({ theme })
  },

  // ─── Delete chat ─────────────────────────────────────────────────────────
  deleteChatMessages: (chatKey) => {
    set(state => {
      const newMessages = { ...state.messages }
      delete newMessages[chatKey]
      return { messages: newMessages }
    })
  },

  getDMRoomId,
}))

export default useStore
