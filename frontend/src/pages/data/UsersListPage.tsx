import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'
import type { AppRole } from '../../types/role'
import { ROLE_LABELS } from '../../types/role'
import { Users, X } from 'lucide-react'

type UserRow = {
  _id: string
  name: string
  email: string
  role: string
  isActive?: boolean
  children?: { _id: string; name: string }[]
}

type UsersResponse = {
  users: UserRow[]
  pagination: { total: number; page: number; pages: number; limit?: number }
}

type UsersListPageProps = {
  title?: string
  filterRole?: AppRole | 'all'
}

function LinkChildrenModal({ parent, onClose, onSaved }: { parent: UserRow; onClose: () => void; onSaved: () => void }) {
  const [students, setStudents] = useState<UserRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set((parent.children ?? []).map((c) => c._id)))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getJson<{ users: UserRow[] }>('/api/users?role=student&limit=200').then((d) => setStudents(d.users ?? [])).catch(() => {})
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true); setErr(null)
    try {
      const res = await apiFetch(`/api/users/${parent._id}/children`, {
        method: 'PUT',
        body: JSON.stringify({ childrenIds: [...selected] }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || 'Failed')
      onSaved()
      onClose()
    } catch (e: any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Link children for <span className="text-teal-400">{parent.name}</span></h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {err && <p className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {students.length === 0 && <p className="text-sm text-slate-500">No students found.</p>}
          {students.map((s) => (
            <label key={s._id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04]">
              <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggle(s._id)}
                className="h-4 w-4 rounded accent-teal-500" />
              <span className="text-sm text-slate-200">{s.name}</span>
              <span className="ml-auto text-xs text-slate-500">{s.email}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export function UsersListPage({ title = 'Users', filterRole = 'all' }: UsersListPageProps) {
  const { role } = useParams()
  const base = role ? `/app/${role}` : ''
  const [data, setData] = useState<UsersResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkingParent, setLinkingParent] = useState<UserRow | null>(null)

  function load() {
    const params = new URLSearchParams({ page: '1', limit: '50' })
    if (filterRole && filterRole !== 'all') params.set('role', filterRole)
    setLoading(true); setErr(null)
    getJson<UsersResponse>(`/api/users?${params}`)
      .then((d) => setData(d))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterRole])

  const isAdmin = role === 'admin'

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {linkingParent && (
        <LinkChildrenModal
          parent={linkingParent}
          onClose={() => setLinkingParent(null)}
          onSaved={load}
        />
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-sm text-slate-500">
            Live data from <code className="rounded bg-white/[0.06] px-1 text-slate-300">GET /api/users</code>
          </p>
        </div>
        {isAdmin && filterRole === 'all' ? (
          <Link to={`${base}/users/register`} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            Add user
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      ) : !data?.users.length ? (
        <p className="text-sm text-slate-400">No users found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111827] shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.08] bg-[#0d1525] text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                {role === 'teacher' && filterRole === 'student' ? <th className="px-4 py-3">SkillUp</th> : null}
                {isAdmin ? <th className="px-4 py-3"></th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {data.users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-3 font-medium text-white">
                    <div>{u.name}</div>
                    {u.role === 'parent' && u.children && u.children.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {u.children.map((c) => (
                          <span key={c._id} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400 border border-violet-500/20">{c.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-slate-300">{ROLE_LABELS[u.role as AppRole] ?? u.role}</td>
                  <td className="px-4 py-3">
                    {u.isActive === false ? <span className="text-amber-600">No</span> : <span className="text-emerald-600">Yes</span>}
                  </td>
                  {role === 'teacher' && filterRole === 'student' ? (
                    <td className="px-4 py-3">
                      <Link to={`${base}/students/${u._id}/skill`} className="text-sm font-semibold text-teal-400 hover:underline">Performance</Link>
                    </td>
                  ) : null}
                  {isAdmin ? (
                    <td className="px-4 py-3 text-right">
                      {u.role === 'parent' && (
                        <button onClick={() => setLinkingParent(u)}
                          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-400 hover:bg-violet-500/20">
                          <Users className="h-3.5 w-3.5" /> Link children
                        </button>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/[0.04] px-4 py-2 text-xs text-slate-500">
            Showing {data.users.length} of {data.pagination.total} users
          </div>
        </div>
      )}
    </div>
  )
}
