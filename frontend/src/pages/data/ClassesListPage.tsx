import { useEffect, useState } from 'react'
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
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Classes</h1>
        <p className="text-sm text-slate-500">
          Live data from <code className="rounded bg-white px-1">GET /api/classes</code>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {err}
        </div>
      ) : !data?.classes.length ? (
        <p className="text-sm text-slate-600">No classes yet. Create one from the API or admin tools.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Academic year</th>
                <th className="px-4 py-3">Class teacher</th>
                <th className="px-4 py-3">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.classes.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{label(c.academicYear)}</td>
                  <td className="px-4 py-3 text-slate-600">{label(c.classTeacher)}</td>
                  <td className="px-4 py-3 text-slate-600">{c.capacity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            Showing {data.classes.length} of {data.pagination.total} classes
          </div>
        </div>
      )}
    </div>
  )
}
