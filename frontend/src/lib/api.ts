import type { AppRole } from '../types/role'

const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? ''

export type LoginUser = {
  _id?: string
  name: string
  email: string
  role: AppRole
  studentClass?: string | null
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

const _cache = new Map<string, { data: unknown; expires: number }>()

export function bustCache(path: string) {
  _cache.delete(path)
}

export async function getJson<T>(path: string, ttl = 0): Promise<T> {
  if (ttl > 0) {
    const hit = _cache.get(path)
    if (hit && hit.expires > Date.now()) return hit.data as T
  }
  const res = await apiFetch(path)
  const body = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) {
    const msg =
      typeof body.message === 'string' ? body.message : `Request failed (${res.status})`
    throw new Error(msg)
  }
  if (ttl > 0) _cache.set(path, { data: body, expires: Date.now() + ttl })
  return body as T
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) {
    const msg =
      typeof data.message === 'string' ? data.message : `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

let _profileCache: LoginUser | null | undefined = undefined
let _profilePromise: Promise<LoginUser | null> | null = null

/** Returns null if not logged in (401 / no cookie). Result is cached for the session lifetime. */
export async function getProfile(): Promise<LoginUser | null> {
  if (_profileCache !== undefined) return _profileCache
  if (_profilePromise) return _profilePromise
  _profilePromise = apiFetch('/api/users/profile').then(async (res) => {
    if (!res.ok) { _profileCache = null; return null }
    const data = (await res.json()) as {
      user?: { _id?: string; name?: string; email?: string; role?: string; studentClass?: string | null }
    }
    const u = data.user
    if (!u?.name || !u?.role) { _profileCache = null; return null }
    _profileCache = {
      _id: u._id,
      name: u.name,
      email: u.email ?? '',
      role: u.role as AppRole,
      studentClass: u.studentClass ?? null,
    }
    return _profileCache
  }).finally(() => { _profilePromise = null })
  return _profilePromise
}

export function clearProfileCache() {
  _profileCache = undefined
  _profilePromise = null
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
