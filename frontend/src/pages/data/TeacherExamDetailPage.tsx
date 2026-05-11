import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'

type ExamDetail = {
  _id: string; title: string; duration?: number; dueDate?: string; isActive?: boolean
  questions?: Array<{ questionText: string; type?: string; options?: string[]; points?: number }>
  subject?: { name?: string }; class?: { name?: string }
}

type Submission = {
  _id: string
  student?: { _id: string; name: string; email: string }
  score?: number
  totalPoints?: number
  submittedAt?: string
}

export function TeacherExamDetailPage() {
  const { role } = useParams()
  const { pathname } = useLocation()
  const base = `/app/${role ?? 'teacher'}`
  const examId = pathname.match(/\/(exams)\/([a-fA-F0-9]{24})\/?$/)?.[2] ?? pathname.split('/').filter(Boolean).pop() ?? ''
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!examId) return
    let c = false
    setLoading(true)
    Promise.all([
      apiFetch(`/api/exams/${examId}`)
        .then(async (res) => {
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error((data as { message?: string }).message ?? 'Failed')
          return data as ExamDetail
        }),
      getJson<{ submissions: Submission[] }>(`/api/exams/${examId}/submissions`)
        .then((d) => d.submissions ?? [])
        .catch(() => []),
    ])
      .then(([examData, subs]) => {
        if (!c) { setExam(examData); setSubmissions(subs) }
      })
      .catch((e: Error) => { if (!c) setErr(e.message) })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [examId])

  async function togglePublish() {
    if (!examId) return
    const res = await apiFetch(`/api/exams/${examId}/status`, { method: 'PATCH' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setErr((data as { message?: string }).message ?? 'Toggle failed'); return }
    setExam((e) => (e ? { ...e, isActive: (data as { isActive?: boolean }).isActive } : e))
  }

  if (!examId) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={`${base}/exams`} className="inline-flex items-center gap-2 text-sm font-medium text-green-400 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All exams
      </Link>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      ) : !exam ? null : (
        <>
          <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-6 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold text-white">{exam.title}</h1>
                <p className="mt-1 text-sm text-slate-400">{exam.class?.name ?? 'Class'} · {exam.subject?.name ?? 'Subject'}</p>
              </div>
              <button type="button" onClick={() => void togglePublish()}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white">
                {exam.isActive ? 'Unpublish' : 'Publish'}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {exam.questions?.length ?? 0} questions · {exam.duration} min
              {exam.dueDate ? ` · Due ${new Date(exam.dueDate).toLocaleString()}` : ''}
            </p>
          </div>

          {/* Student Results */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300">
              Student Results
              <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-400">{submissions.length}</span>
            </h2>
            {!submissions.length ? (
              <p className="rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-6 text-center text-sm text-slate-500">
                No submissions yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111111]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-xs text-slate-500">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {submissions.map((s) => {
                      const pct = s.totalPoints ? Math.round(((s.score ?? 0) / s.totalPoints) * 100) : null
                      return (
                        <tr key={s._id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{s.student?.name ?? '—'}</p>
                            <p className="text-xs text-slate-500">{s.student?.email ?? ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${pct !== null && pct >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {s.score ?? 0} / {s.totalPoints ?? '?'}
                            </span>
                            {pct !== null && <span className="ml-1.5 text-xs text-slate-500">({pct}%)</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300">Questions</h2>
            {!exam.questions?.length ? (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                Questions are still being generated or this draft is empty.
              </p>
            ) : (
              <ol className="space-y-3">
                {exam.questions.map((q, i) => (
                  <li key={i} className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 text-sm shadow-lg">
                    <span className="font-semibold text-green-400">Q{i + 1}</span>
                    <p className="mt-1 text-slate-200">{q.questionText}</p>
                    {q.options?.length ? (
                      <ul className="mt-2 list-inside list-disc text-slate-400">
                        {q.options.map((o) => <li key={o}>{o}</li>)}
                      </ul>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-600">{q.points ?? 1} pt</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  )
}
