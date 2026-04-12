const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

let _getToken = null

export function setTokenGetter(fn) {
  _getToken = fn
}

export async function apiFetch(path, options = {}) {
  const token = _getToken ? await _getToken() : null
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }
  return res.json()
}
