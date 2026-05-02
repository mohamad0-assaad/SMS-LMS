import { Bell, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getJson } from '../../lib/api'
import type { AppRole } from '../../types/role'

type AppHeaderProps = {
  greetingName: string
  subtitle?: string
  role?: AppRole
}

type DashboardStats = {
  recentActivity?: string[]
}

export function AppHeader({ greetingName, subtitle, role }: AppHeaderProps) {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<string[]>([])
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!role) return
    let c = false
    getJson<DashboardStats>('/api/dashboard/stats')
      .then((d) => {
        if (!c && Array.isArray(d.recentActivity)) setItems(d.recentActivity)
      })
      .catch(() => {})
    return () => { c = true }
  }, [role])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <header className="flex flex-col gap-4 border-b border-white/[0.06] bg-[#080e1a] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-white">
          {part}, <span className="text-teal-400">{greetingName}</span>
        </h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {role === 'teacher' && (
          <button
            type="button"
            className="hidden h-9 items-center gap-2 rounded-xl bg-teal-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400 sm:flex"
          >
            Create Report
          </button>
        )}
        {/* Search */}
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-slate-400 transition hover:bg-white/[0.08]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search…</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {items.length > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-400 ring-2 ring-[#080e1a]" />
            )}
          </button>
          {open && (
            <div className="absolute right-0 z-50 mt-2 w-80 max-h-72 overflow-auto rounded-xl border border-white/[0.08] bg-[#111827] py-2 shadow-2xl">
              <p className="border-b border-white/[0.06] px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recent activity
              </p>
              {!items.length ? (
                <p className="px-3 py-2 text-sm text-slate-500">No recent items yet.</p>
              ) : (
                <ul className="text-sm text-slate-300">
                  {items.map((line) => (
                    <li key={line} className="border-b border-white/[0.04] px-3 py-2 last:border-0">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-violet-600 text-xs font-bold text-white shadow">
          {greetingName.slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
