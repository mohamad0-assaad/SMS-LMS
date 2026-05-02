import { useEffect, useState } from 'react'
import { getJson } from '../../lib/api'

type SubjectRow = { _id: string; name: string; code: string; isActive?: boolean }
type SubjectsRes = { subjects?: SubjectRow[] }

export function SubjectsListPage() {
  const [rows, setRows] = useState<SubjectRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    setLoading(true)
    getJson<SubjectsRes>('/api/subjects?page=1&limit=200')
      .then((d) => {
        if (!c) setRows(d.subjects ?? [])
      })
      .catch((e: Error) => {
        if (!c) setErr(e.message)
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Subjects</h1>
        <p className="text-sm text-slate-500">From GET /api/subjects</p>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      ) : !rows.length ? (
        <p className="text-sm text-slate-400">No subjects yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111827] shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.08] bg-[#0d1525] text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {rows.map((s) => (
                <tr key={s._id} className="hover:bg-white/[0.04]">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 text-slate-400">{s.code}</td>
                  <td className="px-4 py-3">{s.isActive === false ? 'No' : 'Yes'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
