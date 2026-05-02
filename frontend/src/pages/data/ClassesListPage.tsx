import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJson } from '../../lib/api'

type Populated = { name?: string; email?: string } | string

type ClassRow = {
  _id: string
  name: string
  capacity?: number
  academicYear?: Populated
  classTeacher?: Populated
}

type ClassesResponse = {
  classes: ClassRow[]
  pagination: { total: number; page: number; pages: number }
}

function label(v: Populated | undefined): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  return v.name ?? v.email ?? '—'
}

export function ClassesListPage() {
  const { role } = useParams()
  const base = role ? `/app/${role}` : ''
  const [data, setData] = useState<ClassesResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)
    getJson<ClassesResponse>('/api/classes?page=1&limit=50')
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
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">Classes</h1>
          <p className="text-sm text-slate-500">
            Live data from <code className="rounded bg-white/[0.06] px-1 text-slate-300">GET /api/classes</code>
            {role === 'teacher'
              ? ' — only classes where you are the assigned class teacher.'
              : ''}
          </p>
        </div>
        {role === 'admin' ? (
          <Link
            to={`${base}/classes/new`}
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Create class
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
      ) : !data?.classes.length ? (
        <p className="text-sm text-slate-400">No classes yet. Create one from the API or admin tools.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111827] shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.08] bg-[#0d1525] text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Academic year</th>
                <th className="px-4 py-3">Class teacher</th>
                <th className="px-4 py-3">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {data.classes.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400">{label(c.academicYear)}</td>
                  <td className="px-4 py-3 text-slate-400">{label(c.classTeacher)}</td>
                  <td className="px-4 py-3 text-slate-400">{c.capacity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/[0.04] px-4 py-2 text-xs text-slate-500">
            Showing {data.classes.length} of {data.pagination.total} classes
          </div>
        </div>
      )}
    </div>
  )
}
