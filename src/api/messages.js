import { apiFetch } from './client'

export const messagesApi = {
  getDM:        (partnerId, before) => apiFetch(`/api/messages/dm/${partnerId}${before ? `?before=${before}` : ''}`),
  getGroup:     (groupId, before)   => apiFetch(`/api/messages/group/${groupId}${before ? `?before=${before}` : ''}`),
  sendDM:       (receiverId, text)  => apiFetch('/api/messages/dm',    { method: 'POST', body: JSON.stringify({ receiverId, text }) }),
  sendGroup:    (groupId, text)     => apiFetch('/api/messages/group', { method: 'POST', body: JSON.stringify({ groupId, text }) }),
  markDMRead:   (partnerId)         => apiFetch(`/api/messages/dm/${partnerId}/read`,    { method: 'POST' }),
  markGroupRead:(groupId)           => apiFetch(`/api/messages/group/${groupId}/read`,   { method: 'POST' }),
  deleteDM:     (partnerId)         => apiFetch(`/api/messages/dm/${partnerId}`,         { method: 'DELETE' }),
  deleteGroup:  (groupId)           => apiFetch(`/api/messages/group/${groupId}`,        { method: 'DELETE' }),
}
