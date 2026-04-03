import { useEffect, useState } from 'react'
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
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">
          Live data from <code className="rounded bg-white px-1">GET /api/users</code>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {err}
        </div>
      ) : !data?.users.length ? (
        <p className="text-sm text-slate-600">No users found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {ROLE_LABELS[u.role as AppRole] ?? u.role}
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive === false ? (
                      <span className="text-amber-600">No</span>
                    ) : (
                      <span className="text-emerald-600">Yes</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            Showing {data.users.length} of {data.pagination.total} users
          </div>
        </div>
      )}
    </div>
  )
}
