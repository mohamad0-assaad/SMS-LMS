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

  async function handleApiSignIn(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password to sign in.')
      return
    }
    setLoading(true)
    try {
      const user = await loginRequest(email.trim(), password)
      if (!isAppRole(user.role)) throw new Error('Unknown role returned from server')
      localStorage.setItem(DEMO_KEY, JSON.stringify({ name: user.name, role: user.role }))
      navigate(`/app/${user.role}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoSignIn(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    const profile = { name: displayName.trim() || 'SkillUp User', role }
    localStorage.setItem(DEMO_KEY, JSON.stringify(profile))
    navigate(`/app/${role}`, { replace: true })
  }

  return (
    <div className="relative flex min-h-svh font-sans">
      {/* Left — photo panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5">
        <div className="relative w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1280&q=80"
            alt="Modern classroom"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080e1a]/80 to-[#080e1a]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-transparent to-transparent" />
          <div className="absolute bottom-12 left-10 max-w-sm">
            <p className="text-2xl font-bold text-white leading-snug">
              "Elevate every classroom with data-driven insights."
            </p>
            <p className="mt-3 text-sm text-slate-400">SkillUp LMS — AI-powered school management</p>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#080e1a] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-violet-600 shadow-xl shadow-teal-900/40">
              <GraduationCap className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">SkillUp LMS</h1>
            <p className="mt-1 text-sm text-slate-500">Adaptive School Management &amp; Learning System</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-8 shadow-2xl">
            <h2 className="mb-5 text-base font-semibold text-white">Sign in to your account</h2>
            <form onSubmit={handleApiSignIn} className="space-y-4">
              {error && (
                <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400" role="alert">
                  {error}
                </p>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-teal-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-teal-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition enabled:hover:from-teal-400 enabled:hover:to-violet-500 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-600">
              Connects to <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-slate-400">POST /api/users/login</code>
            </p>

            {/* Demo section */}
            <details className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-300">
                Offline demo (no backend needed)
              </summary>
              <form onSubmit={handleDemoSignIn} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-400">Role</label>
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
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1525] px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-400">Display name</label>
                  <input
                    id="name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1525] px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Open {ROLE_LABELS[role]} dashboard
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
