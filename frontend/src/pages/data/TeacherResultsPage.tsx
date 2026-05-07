import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJson } from '../../lib/api'
import { SkeletonTable } from '../../components/ui/Skeleton'

type Pop = { _id?: string; name?: string; section?: string } | string
type ExamRow = { _id: string; title: string; isActive?: boolean; class?: Pop; subject?: Pop; questions?: unknown[]; dueDate?: string }

function label(p: Pop | undefined): string {
  if (p == null) return 'Class'
  if (typeof p === 'string') return p
  return [p.name, p.section].filter(Boolean).join(' ') || 'Class'
}

function statusLabel(e: ExamRow): { text: string; cls: string } {
  const q = Array.isArray(e.questions) ? e.questions.length : 0
  if (!e.isActive) return { text: 'Draft', cls: 'bg-white/[0.06] text-slate-400 border-white/[0.08]' }
  if (q === 0)    return { text: 'Generating', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/20' }
  return { text: 'Live', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' }
}

export function TeacherResultsPage() {
  const { role } = useParams()
  const base = `/app/${role ?? 'teacher'}`
  const [exams, setExams] = useState<ExamRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr(null)
    getJson<ExamRow[]>('/api/exams', 30_000)
      .then((rows) => { if (!cancelled) setExams(Array.isArray(rows) ? rows : []) })
      .catch((e: Error) => { if (!cancelled) setErr(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const byClass = useMemo(() => {
    const map = new Map<string, { label: string; exams: ExamRow[] }>()
    for (const e of exams) {
      const cid = typeof e.class === 'object' && e.class && '_id' in e.class && e.class._id
        ? String(e.class._id) : typeof e.class === 'string' ? e.class : 'unassigned'
      const classLabel = label(e.class)
      if (!map.has(cid)) map.set(cid, { label: classLabel, exams: [] })
      map.get(cid)!.exams.push(e)
    }
    return [...map.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label))
  }, [exams])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Results &amp; Exams by Class</h1>
        <p className="text-sm text-slate-500">Every exam you created, grouped by class.</p>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      ) : !exams.length ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#111111] px-6 py-10 text-center">
          <p className="font-medium text-slate-300">No exams yet</p>
          <p className="mt-1 text-sm text-slate-500">Generate one with AI or add manual drafts.</p>
          <Link to={`${base}/ai/exam`} className="mt-4 inline-block rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
            AI exam generator
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {byClass.map(([cid, { label: classLabel, exams: list }]) => (
            <section key={cid} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111111] shadow-lg">
              <div className="border-b border-white/[0.06] bg-[#0d1a0d] px-4 py-3">
                <h2 className="text-sm font-semibold text-white">{classLabel}</h2>
                <p className="text-xs text-slate-500">{list.length} exam(s)</p>
              </div>
              <ul className="divide-y divide-white/[0.06]">
                {list.map((e) => {
                  const st = statusLabel(e)
                  return (
                    <li key={e._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{e.title}</p>
                        <p className="text-xs text-slate-500">
                          {typeof e.subject === 'object' && e.subject && 'name' in e.subject ? e.subject.name : ''}
                          {e.dueDate ? ` · Due ${new Date(e.dueDate).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.text}</span>
                        <Link to={`${base}/exams/${e._id}`}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white">
                          Open
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
