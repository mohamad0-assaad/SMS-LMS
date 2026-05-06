import { useEffect, useState } from 'react'
import { getJson } from '../../lib/api'

type ResultRow = { _id: string; score: number; maxScore: number; submittedAt?: string; examTitle: string; examDue?: string }

export function StudentResultsPage() {
  const [rows, setRows] = useState<ResultRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    setLoading(true)
    getJson<ResultRow[]>('/api/exams/my-results')
      .then((r) => { if (!c) setRows(Array.isArray(r) ? r : []) })
      .catch((e: Error) => { if (!c) setErr(e.message) })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">My Results</h1>
        <p className="text-sm text-slate-500">Graded attempts — score / max points.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      ) : !rows.length ? (
        <p className="text-sm text-slate-500">No graded submissions yet.</p>
      ) : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-lg">
          {rows.map((r) => {
            const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 1000) / 10 : 0
            return (
              <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="font-medium text-white">{r.examTitle}</p>
                  <p className="text-xs text-slate-500">
                    {r.submittedAt ? `Submitted ${new Date(r.submittedAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{r.score} / {r.maxScore}</p>
                  <p className={`text-xs font-medium ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{pct}%</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
