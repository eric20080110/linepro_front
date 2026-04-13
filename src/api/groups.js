import { apiFetch } from './client'

export const groupsApi = {
  list: () => apiFetch('/api/groups'),
  create: (data) => apiFetch('/api/groups', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => apiFetch(`/api/groups/${id}`),
  update: (id, data) => apiFetch(`/api/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addMembers: (id, memberIds) => apiFetch(`/api/groups/${id}/members`, { method: 'POST', body: JSON.stringify({ memberIds }) }),
  kickMember: (id, userId) => apiFetch(`/api/groups/${id}/members/${userId}`, { method: 'DELETE' }),
  setMemberAdmin: (id, userId, isAdmin) => apiFetch(`/api/groups/${id}/members/${userId}/admin`, { method: 'PATCH', body: JSON.stringify({ isAdmin }) }),
  leave: (id) => apiFetch(`/api/groups/${id}/leave`, { method: 'DELETE' }),
}
