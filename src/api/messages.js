import { apiFetch } from './client'

export const messagesApi = {
  getDM: (partnerId, before) => {
    const qs = before ? `?before=${before}` : ''
    return apiFetch(`/api/messages/dm/${partnerId}${qs}`)
  },
  getGroup: (groupId, before) => {
    const qs = before ? `?before=${before}` : ''
    return apiFetch(`/api/messages/group/${groupId}${qs}`)
  },
  sendDM: (receiverId, text) => apiFetch('/api/messages/dm', { method: 'POST', body: JSON.stringify({ receiverId, text }) }),
  sendGroup: (groupId, text) => apiFetch('/api/messages/group', { method: 'POST', body: JSON.stringify({ groupId, text }) }),
  deleteDM: (partnerId) => apiFetch(`/api/messages/dm/${partnerId}`, { method: 'DELETE' }),
  deleteGroup: (groupId) => apiFetch(`/api/messages/group/${groupId}`, { method: 'DELETE' }),
}
