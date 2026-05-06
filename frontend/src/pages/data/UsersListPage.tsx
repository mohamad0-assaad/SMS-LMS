import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'
import type { AppRole } from '../../types/role'
import { ROLE_LABELS } from '../../types/role'
import {
  GraduationCap,
  MoreHorizontal,
  School,
  ShieldCheck,
  BookUser,
  Users,
  X,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type StudentClass = { _id: string; name: string } | string

type UserRow = {
  _id: string
  name: string
  email: string
  role: string
  isActive?: boolean
  children?: { _id: string; name: string }[]
  studentClass?: StudentClass
}

type UsersResponse = {
  users: UserRow[]
  pagination: { total: number; page: number; pages: number; limit?: number }
}

type UsersListPageProps = {
  title?: string
  filterRole?: AppRole | 'all'
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROLE_TABS = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'student', label: 'Students', icon: GraduationCap },
  { key: 'teacher', label: 'Teachers', icon: School },
  { key: 'parent', label: 'Parents', icon: BookUser },
  { key: 'admin', label: 'Admins', icon: ShieldCheck },
]

const AVATAR_COLORS = [
  'bg-green-800', 'bg-emerald-800', 'bg-green-700',
  'bg-emerald-700', 'bg-green-900', 'bg-emerald-900',
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}
function className(sc: StudentClass | undefined): string | null {
  if (!sc) return null
  if (typeof sc === 'string') return sc
  return sc.name ?? null
}

// ─── Link children modal ────────────────────────────────────────────────────────

function LinkChildrenModal({
  parent,
  onClose,
  onSaved,
}: {
  parent: UserRow
  onClose: () => void
  onSaved: () => void
}) {
  const [students, setStudents] = useState<UserRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(
    new Set((parent.children ?? []).map((c) => c._id))
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getJson<{ users: UserRow[] }>('/api/users?role=student&limit=200')
      .then((d) => setStudents(d.users ?? []))
      .catch(() => {})
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      const res = await apiFetch(`/api/users/${parent._id}/children`, {
        method: 'PUT',
        body: JSON.stringify({ childrenIds: [...selected] }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || 'Failed')
      onSaved()
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-green-500/20 bg-[#111111] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">
            Link children for <span className="text-green-400">{parent.name}</span>
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        {err && (
          <p className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            {err}
          </p>
        )}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {students.length === 0 && <p className="text-sm text-slate-500">No students found.</p>}
          {students.map((s) => (
            <label
              key={s._id}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04]"
            >
              <input
                type="checkbox"
                checked={selected.has(s._id)}
                onChange={() => toggle(s._id)}
                className="h-4 w-4 rounded accent-green-500"
              />
              <span className="text-sm text-slate-200">{s.name}</span>
              <span className="ml-auto text-xs text-slate-500">{s.email}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-xl bg-green-700 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dropdown menu ──────────────────────────────────────────────────────────────

function CardMenu({
  onLinkChildren,
}: {
  onLinkChildren?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!onLinkChildren) return null

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 hover:border-green-500/30 hover:text-white transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-2xl">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Actions
          </p>
          {onLinkChildren && (
            <button
              onClick={() => { onLinkChildren(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white"
            >
              <Users className="h-3.5 w-3.5" /> Link children
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111] p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-full bg-white/[0.06]" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
        <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
      </div>
      <div className="h-5 w-1/3 rounded-full bg-white/[0.06]" />
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function UsersListPage({ title = 'Users', filterRole = 'all' }: UsersListPageProps) {
  const { role } = useParams()
  const base = role ? `/app/${role}` : ''
  const isAdmin = role === 'admin'
  const isTeacherStudentView = role === 'teacher' && filterRole === 'student'

  const [activeTab, setActiveTab] = useState<string>(
    filterRole === 'all' ? 'all' : (filterRole as string)
  )
  const [data, setData] = useState<UsersResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkingParent, setLinkingParent] = useState<UserRow | null>(null)

  const fetchRole =
    filterRole === 'all' ? (activeTab === 'all' ? undefined : activeTab) : filterRole

  function load() {
    const params = new URLSearchParams({ page: '1', limit: '100' })
    if (fetchRole) params.set('role', fetchRole)
    setLoading(true)
    setErr(null)
    getJson<UsersResponse>(`/api/users?${params}`)
      .then((d) => setData(d))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [activeTab, filterRole])

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {linkingParent && (
        <LinkChildrenModal
          parent={linkingParent}
          onClose={() => setLinkingParent(null)}
          onSaved={load}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-slate-500">
            {data ? `${data.pagination.total} total` : 'Loading…'}
          </p>
        </div>
        {isAdmin && filterRole === 'all' && (
          <Link
            to={`${base}/users/register`}
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600"
          >
            + Add user
          </Link>
        )}
      </div>

      {/* Role tabs */}
      {filterRole === 'all' && isAdmin && (
        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? 'bg-green-700 text-white shadow-lg shadow-green-900/30'
                    : 'border border-white/[0.08] bg-[#161616] text-slate-400 hover:border-green-500/30 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.users.length ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Users className="mb-3 h-12 w-12 text-green-700/40" />
          <p className="text-slate-400">No users found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.users.map((u) => {
            const cls = className(u.studentClass)
            return (
              <div
                key={u._id}
                className="relative rounded-2xl border border-white/[0.07] bg-[#111111] p-4 transition-all hover:border-green-500/20 hover:bg-[#141414] hover:shadow-md hover:shadow-black/40"
              >
                {/* Avatar row */}
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(u.name)}`}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${u.isActive === false ? 'bg-amber-500' : 'bg-green-500'}`}
                      title={u.isActive === false ? 'Inactive' : 'Active'}
                    />
                    {isAdmin && u.role === 'parent' && (
                      <CardMenu onLinkChildren={() => setLinkingParent(u)} />
                    )}
                  </div>
                </div>

                {/* Name + email */}
                <p className="font-semibold leading-tight text-white">{u.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{u.email}</p>

                {/* Class badge for students */}
                {u.role === 'student' && cls && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <School className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-slate-400">{cls}</span>
                  </div>
                )}

                {/* Role badge */}
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full border border-green-700/30 bg-green-900/40 px-2.5 py-0.5 text-xs font-medium text-green-400">
                    {ROLE_LABELS[u.role as AppRole] ?? u.role}
                  </span>
                </div>

                {/* Linked children */}
                {u.role === 'parent' && u.children && u.children.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {u.children.map((c) => (
                      <span
                        key={c._id}
                        className="rounded-full border border-emerald-700/20 bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-400"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Teacher view: performance link */}
                {isTeacherStudentView && (
                  <Link
                    to={`${base}/students/${u._id}/skill`}
                    className="mt-3 block text-xs font-semibold text-green-400 hover:underline"
                  >
                    View Performance →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}

      {data && (
        <p className="text-xs text-slate-600">
          Showing {data.users.length} of {data.pagination.total} users
        </p>
      )}
    </div>
  )
}
