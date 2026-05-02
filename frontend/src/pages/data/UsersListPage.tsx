import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJson } from '../../lib/api'
import type { AppRole } from '../../types/role'
import { ROLE_LABELS } from '../../types/role'

type UserRow = {
  _id: string
  name: string
  email: string
  role: string
  isActive?: boolean
}

type UsersResponse = {
  users: UserRow[]
  pagination: { total: number; page: number; pages: number; limit?: number }
}

type UsersListPageProps = {
  title?: string
  /** When set, adds ?role= to the API (e.g. student). */
  filterRole?: AppRole | 'all'
}

export function UsersListPage({ title = 'Users', filterRole = 'all' }: UsersListPageProps) {
  const { role } = useParams()
  const base = role ? `/app/${role}` : ''
  const [data, setData] = useState<UsersResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ page: '1', limit: '50' })
    if (filterRole && filterRole !== 'all') params.set('role', filterRole)
    setLoading(true)
    setErr(null)
    getJson<UsersResponse>(`/api/users?${params}`)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filterRole])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-sm text-slate-500">
            Live data from <code className="rounded bg-white/[0.06] px-1 text-slate-300">GET /api/users</code>
          </p>
        </div>
        {role === 'admin' && filterRole === 'all' ? (
          <Link
            to={`${base}/users/register`}
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Add user
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
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
                {role === 'teacher' && filterRole === 'student' ? (
                  <th className="px-4 py-3">SkillUp</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {data.users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {ROLE_LABELS[u.role as AppRole] ?? u.role}
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive === false ? (
                      <span className="text-amber-600">No</span>
                    ) : (
                      <span className="text-emerald-600">Yes</span>
                    )}
                  </td>
                  {role === 'teacher' && filterRole === 'student' ? (
                    <td className="px-4 py-3">
                      <Link
                        to={`${base}/students/${u._id}/skill`}
                        className="text-sm font-semibold text-teal-400 hover:underline"
                      >
                        Performance
                      </Link>
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
