import { useEffect, useState } from 'react'
import { getJson } from '../../lib/api'

type YearRow = { _id: string; name: string; startDate?: string; endDate?: string }
type YearsRes = { years?: YearRow[] }

export function AcademicYearsPage() {
  const [rows, setRows] = useState<YearRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    setLoading(true)
    getJson<YearsRes>('/api/academic-years?page=1&limit=100')
      .then((d) => {
        if (!c) setRows(d.years ?? [])
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
        <h1 className="text-lg font-semibold text-white">Academic years</h1>
        <p className="text-sm text-slate-500">Admin-only API</p>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      ) : !rows.length ? (
        <p className="text-sm text-slate-500">No academic years configured.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((y) => (
            <li
              key={y._id}
              className="rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-3 shadow-lg"
            >
              <p className="font-medium text-white">{y.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
