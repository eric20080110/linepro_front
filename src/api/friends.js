import { apiFetch } from './client'

export const friendsApi = {
  list: () => apiFetch('/api/friends'),
  requests: () => apiFetch('/api/friends/requests'),
  sendRequest: (targetId) => apiFetch('/api/friends/request', { method: 'POST', body: JSON.stringify({ targetId }) }),
  accept: (requesterId) => apiFetch('/api/friends/accept', { method: 'POST', body: JSON.stringify({ requesterId }) }),
  reject: (requesterId) => apiFetch('/api/friends/reject', { method: 'POST', body: JSON.stringify({ requesterId }) }),
  remove: (friendId) => apiFetch(`/api/friends/${friendId}`, { method: 'DELETE' }),
}
