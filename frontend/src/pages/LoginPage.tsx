import { GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, loginRequest } from '../lib/api'
import type { AppRole } from '../types/role'
import { isAppRole, ROLE_LABELS } from '../types/role'

const DEMO_KEY = 'skillup-demo-profile'

const roles: AppRole[] = ['student', 'teacher', 'admin', 'parent']

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('student')
  const [displayName, setDisplayName] = useState('Adam Student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((p) => {
      if (p && isAppRole(p.role)) {
        navigate(`/app/${p.role}`, { replace: true })
      }
    })
  }, [navigate])

  async function handleApiSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter email and password to sign in with your school account.')
      return
    }
    setLoading(true)
    try {
      const user = await loginRequest(email.trim(), password)
      if (!isAppRole(user.role)) {
        throw new Error('Unknown role returned from server')
      }
      const r = user.role
      localStorage.setItem(DEMO_KEY, JSON.stringify({ name: user.name, role: r }))
      navigate(`/app/${r}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const profile = { name: displayName.trim() || 'SkillUp User', role }
    localStorage.setItem(DEMO_KEY, JSON.stringify(profile))
    navigate(`/app/${role}`, { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50/40 to-slate-100 px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/30">
            <GraduationCap className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            SkillUp LMS
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Adaptive School Management &amp; Learning System
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleApiSignIn} className="space-y-5">
            {error ? (
              <p
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none ring-violet-500/20 transition focus:border-violet-400 focus:bg-white focus:ring-4"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none ring-violet-500/20 transition focus:border-violet-400 focus:bg-white focus:ring-4"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition enabled:hover:from-violet-500 enabled:hover:to-fuchsia-500 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Runs against <code className="rounded bg-slate-100 px-1">POST /api/users/login</code>{' '}
            via the Vite proxy. Start the API on port 5000.
          </p>

          <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Offline UI demo (no backend)
            </summary>
            <form onSubmit={handleDemoSignIn} className="mt-4 space-y-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value as AppRole
                    setRole(r)
                    if (r === 'student') setDisplayName('Adam Student')
                    else if (r === 'teacher') setDisplayName('Sara Teacher')
                    else if (r === 'admin') setDisplayName('Admin User')
                    else setDisplayName('Parent User')
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-violet-500/20 focus:border-violet-400 focus:ring-4"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Display name
                </label>
                <input
                  id="name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-violet-500/20 focus:border-violet-400 focus:ring-4"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Open {ROLE_LABELS[role]} dashboard
              </button>
            </form>
          </details>
        </div>
      </div>
    </div>
  )
}
