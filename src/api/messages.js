import { apiFetch } from './client'

export const messagesApi = {
  getDM:        (partnerId, before) => apiFetch(`/api/messages/dm/${partnerId}${before ? `?before=${before}` : ''}`),
  getGroup:     (groupId, before)   => apiFetch(`/api/messages/group/${groupId}${before ? `?before=${before}` : ''}`),
  sendDM:       (receiverId, text, mediaUrl, replyToId)  => apiFetch('/api/messages/dm',    { method: 'POST', body: JSON.stringify({ receiverId, text, mediaUrl, replyToId }) }),
  sendGroup:    (groupId, text, mediaUrl, replyToId)     => apiFetch('/api/messages/group', { method: 'POST', body: JSON.stringify({ groupId, text, mediaUrl, replyToId }) }),
  markDMRead:   (partnerId)         => apiFetch(`/api/messages/dm/${partnerId}/read`,    { method: 'POST' }),
  markGroupRead:(groupId)           => apiFetch(`/api/messages/group/${groupId}/read`,   { method: 'POST' }),
  pin:          (messageId, pinned) => apiFetch(`/api/messages/${messageId}/pin`,        { method: 'PATCH', body: JSON.stringify({ pinned }) }),
  recall:       (messageId)         => apiFetch(`/api/messages/${messageId}/recall`,     { method: 'PATCH' }),
  react:        (messageId, emoji)  => apiFetch(`/api/messages/${messageId}/react`,      { method: 'POST', body: JSON.stringify({ emoji }) }),
  deleteDM:     (partnerId)         => apiFetch(`/api/messages/dm/${partnerId}`,         { method: 'DELETE' }),
  deleteGroup:  (groupId)           => apiFetch(`/api/messages/group/${groupId}`,        { method: 'DELETE' }),
}
