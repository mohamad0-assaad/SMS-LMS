import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { AppSidebar } from '../components/layout/AppSidebar'
import { getProfile, logoutRequest } from '../lib/api'
import { isAppRole, type AppRole } from '../types/role'

const DEMO_KEY = 'skillup-demo-profile'

export type DemoProfile = { name: string; role: AppRole }

function loadDemo(): DemoProfile | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DemoProfile
  } catch {
    return null
  }
}

export function DashboardLayout() {
  const { role: roleParam } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  const roleValid = isAppRole(roleParam)
  const demo = roleValid ? loadDemo() : null
  const demoWrongRole = Boolean(
    roleValid && demo && demo.role !== roleParam,
  )

  useEffect(() => {
    if (!roleValid || demoWrongRole) return

    const role = roleParam as AppRole
    const stored = loadDemo()
    if (stored?.role === role) {
      setUserName(stored.name)
      setSessionReady(true)
      return
    }

    let cancelled = false
    getProfile().then((p) => {
      if (cancelled) return
      if (!p || !isAppRole(p.role)) {
        navigate('/login', { replace: true })
        return
      }
      if (p.role !== role) {
        navigate(`/app/${p.role}`, { replace: true })
        return
      }
      localStorage.setItem(DEMO_KEY, JSON.stringify({ name: p.name, role: p.role }))
      setUserName(p.name)
      setSessionReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [roleParam, roleValid, demoWrongRole, navigate])

  if (!roleValid) {
    return <Navigate to="/login" replace />
  }

  if (demoWrongRole && demo) {
    return <Navigate to={`/app/${demo.role}`} replace />
  }

  const role = roleParam as AppRole

  const headerSubtitle =
    role === 'student'
      ? 'Here is your learning snapshot for today.'
      : role === 'teacher'
        ? 'Track classes, exams, and learner progress.'
        : role === 'admin'
          ? 'School-wide overview and AI signals.'
          : 'Stay close to your child’s progress.'

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch {
      /* cookie may already be gone */
    }
    localStorage.removeItem(DEMO_KEY)
    navigate('/login', { replace: true })
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-100 font-sans text-slate-600">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex min-h-svh font-sans">
      <AppSidebar role={role} userName={userName} onLogout={handleLogout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader greetingName={userName.split(' ')[0] ?? userName} subtitle={headerSubtitle} />
        <main className="flex-1 overflow-auto bg-slate-100 p-6">
          <Outlet context={{ role, userName }} />
        </main>
      </div>
    </div>
  )
}
