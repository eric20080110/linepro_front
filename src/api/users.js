import { apiFetch } from './client'

export const usersApi = {
  sync: () => apiFetch('/api/users/sync', { method: 'POST' }),
  me: () => apiFetch('/api/users/me'),
  updateMe: (data) => apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  search: (q) => apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`),
}
