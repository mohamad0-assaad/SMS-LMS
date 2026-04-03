import type { AppRole } from '../types/role'

const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? ''

export type LoginUser = {
  _id?: string
  name: string
  email: string
  role: AppRole
}

function url(path: string) {
  if (path.startsWith('http')) return path
  return `${API_PREFIX}${path}`
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(url(path), {
    ...init,
    credentials: 'include',
    headers,
  })
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path)
  const body = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) {
    const msg =
      typeof body.message === 'string' ? body.message : `Request failed (${res.status})`
    throw new Error(msg)
  }
  return body as T
}

/** Returns null if not logged in (401 / no cookie). */
export async function getProfile(): Promise<LoginUser | null> {
  const res = await apiFetch('/api/users/profile')
  if (!res.ok) return null
  const data = (await res.json()) as {
    user?: { _id?: string; name?: string; email?: string; role?: string }
  }
  const u = data.user
  if (!u?.name || !u?.role) return null
  return {
    _id: u._id,
    name: u.name,
    email: u.email ?? '',
    role: u.role as AppRole,
  }
}

export async function loginRequest(email: string, password: string): Promise<LoginUser> {
  const res = await apiFetch('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string } & Partial<LoginUser>
  if (!res.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Login failed')
  }
  if (!data.role || !data.name) {
    throw new Error('Unexpected login response')
  }
  return data as LoginUser
}

export async function logoutRequest(): Promise<void> {
  await apiFetch('/api/users/logout', { method: 'POST' })
}
