import { BookOpen, Calendar, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJson } from '../../lib/api'
import { SkeletonTable } from '../../components/ui/Skeleton'

type Pop = { name?: string } | string

type ExamRow = {
  _id: string
  title: string
  duration?: number
  dueDate?: string
  subject?: Pop
  class?: Pop
}

function label(p: Pop | undefined): string {
  if (p == null) return '—'
  if (typeof p === 'string') return p
  return p.name ?? '—'
}

export function StudentExamsPage() {
  const { role } = useParams()
  const base = `/app/${role ?? 'student'}`
  const [exams, setExams] = useState<ExamRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    setLoading(true)
    getJson<ExamRow[]>('/api/exams', 20_000)
      .then((rows) => {
        if (!c) setExams(Array.isArray(rows) ? rows : [])
      })
      .catch((e: Error) => {
        if (!c) setErr(e.message)
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => { c = true }
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">My Exams</h1>
        <p className="mt-0.5 text-sm text-slate-500">Published exams available for your class.</p>
      </div>

      {loading ? (
        <SkeletonTable rows={4} />
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
      ) : !exams.length ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] px-6 py-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">No published exams for your class right now.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {exams.map((ex) => (
            <li
              key={ex._id}
              className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 shadow-lg"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-white">{ex.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {label(ex.subject)} · {label(ex.class)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {ex.duration != null && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {ex.duration} min
                      </span>
                    )}
                    {ex.dueDate && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        Due {new Date(ex.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`${base}/exams/${ex._id}`}
                  className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-500"
                >
                  Start Exam →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
