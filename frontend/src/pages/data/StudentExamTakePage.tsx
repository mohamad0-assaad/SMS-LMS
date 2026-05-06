import { CheckCircle, ChevronLeft, Clock, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { apiFetch } from '../../lib/api'

type Question = {
  _id: string
  questionText: string
  type?: string
  options?: string[]
  points?: number
}

type ExamDetail = {
  _id: string
  title: string
  duration?: number
  dueDate?: string
  questions: Question[]
  subject?: { name?: string }
  class?: { name?: string }
}

type Phase = 'loading' | 'error' | 'taking' | 'submitting' | 'done'

function useCountdown(seconds: number, active: boolean) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
  }, [seconds])
  useEffect(() => {
    if (!active || left <= 0) return
    const id = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [active, left])
  return left
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function StudentExamTakePage() {
  const { role } = useParams()
  const { pathname } = useLocation()
  const base = `/app/${role ?? 'student'}`
  const examId = pathname.match(/\/exams\/([a-fA-F0-9]{24})/)?.[1] ?? ''

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [err, setErr] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState<number | null>(null)
  const [maxScore, setMaxScore] = useState<number | null>(null)
  const timerDuration = (exam?.duration ?? 0) * 60
  const timeLeft = useCountdown(timerDuration, phase === 'taking')
  const autoSubmitted = useRef(false)
  const timerEverStarted = useRef(false)

  useEffect(() => {
    if (!examId) return
    let cancelled = false
    apiFetch(`/api/exams/${examId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { message?: string }).message ?? 'Failed to load exam')
        return data as ExamDetail
      })
      .then((d) => {
        if (!cancelled) {
          setExam(d)
          setPhase('taking')
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message)
          setPhase('error')
        }
      })
    return () => { cancelled = true }
  }, [examId])

  async function submit() {
    if (!exam) return
    setPhase('submitting')
    const payload = exam.questions.map((q) => ({
      questionId: q._id,
      answer: answers[q._id] ?? '',
    }))
    try {
      const res = await apiFetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string; score?: number }
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`)
      const total = exam.questions.reduce((sum, q) => sum + (q.points ?? 1), 0)
      setScore(data.score ?? 0)
      setMaxScore(total)
      setPhase('done')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Submission failed')
      setPhase('taking')
    }
  }

  // Track once the countdown has actually started (guards against the initial 0 value)
  useEffect(() => {
    if (timeLeft > 0) timerEverStarted.current = true
  }, [timeLeft])

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (phase === 'taking' && timerDuration > 0 && timeLeft <= 0 && !autoSubmitted.current && timerEverStarted.current) {
      autoSubmitted.current = true
      void submit()
    }
  }, [timeLeft, phase, timerDuration])

  const answeredCount = Object.values(answers).filter(Boolean).length
  const totalQ = exam?.questions.length ?? 0
  const allAnswered = answeredCount === totalQ && totalQ > 0
  const pct = score != null && maxScore ? Math.round((score / maxScore) * 100) : 0
  const timerWarning = timeLeft <= 120 && phase === 'taking'

  if (!examId) return null

  if (phase === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link to={`${base}/exams`} className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to exams
        </Link>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 shadow-lg">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h1 className="mt-4 text-xl font-bold text-white">Exam submitted!</h1>
          <p className="mt-1 text-sm text-slate-400">{exam?.title}</p>
          <div className="mt-6 flex items-end justify-center gap-1">
            <span className="text-5xl font-bold text-white">{score}</span>
            <span className="mb-1.5 text-lg text-slate-500">/ {maxScore}</span>
          </div>
          <div className="mt-2 text-sm text-slate-400">{pct}% — {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep studying!'}</div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-2 rounded-full transition-all ${pct >= 80 ? 'bg-green-400' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Link
          to={`${base}/results`}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-500"
        >
          View all results
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-6 -mt-5 border-b border-white/[0.06] bg-[#080808]/95 px-6 py-4 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-white">{exam?.title}</h1>
            <p className="text-xs text-slate-500">
              {exam?.subject?.name} · {exam?.class?.name} · {answeredCount}/{totalQ} answered
            </p>
          </div>
          <div className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold tabular-nums ${
            timerWarning ? 'bg-rose-500/20 text-rose-400' : 'bg-white/[0.06] text-slate-300'
          }`}>
            <Clock className="h-4 w-4" />
            {exam?.duration ? fmtTime(timeLeft) : 'No limit'}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-1.5 rounded-full bg-green-500 transition-all duration-300"
            style={{ width: totalQ > 0 ? `${(answeredCount / totalQ) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Questions */}
      <ol className="space-y-4">
        {exam?.questions.map((q, i) => {
          const selected = answers[q._id]
          return (
            <li key={q._id} className={`rounded-xl border bg-[#111111] p-5 shadow-lg transition-colors ${
              selected ? 'border-green-500/40' : 'border-white/[0.06]'
            }`}>
              <p className="text-sm font-semibold text-white">
                <span className="mr-2 text-green-400">Q{i + 1}.</span>
                {q.questionText}
              </p>
              {q.options?.length ? (
                <ul className="mt-3 space-y-2">
                  {q.options.map((opt) => {
                    const checked = selected === opt
                    return (
                      <li key={opt}>
                        <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                          checked
                            ? 'border-green-500/60 bg-green-500/10 text-green-200 font-medium'
                            : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:border-white/10 hover:bg-white/[0.04]'
                        }`}>
                          <input
                            type="radio"
                            name={q._id}
                            value={opt}
                            checked={checked}
                            onChange={() => setAnswers((a) => ({ ...a, [q._id]: opt }))}
                            className="mt-0.5 shrink-0 accent-green-500"
                          />
                          {opt}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500">No options — short answer</p>
              )}
              <p className="mt-2 text-right text-xs text-slate-600">{q.points ?? 1} pt</p>
            </li>
          )
        })}
      </ol>

      {/* Submit */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 shadow-lg">
        {!allAnswered && (
          <p className="mb-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            {totalQ - answeredCount} question{totalQ - answeredCount !== 1 ? 's' : ''} still unanswered.
            Unanswered questions score 0.
          </p>
        )}
        {err && (
          <p className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>
        )}
        <button
          type="button"
          disabled={phase === 'submitting'}
          onClick={() => void submit()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-60"
        >
          {phase === 'submitting' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            <>Submit exam ({answeredCount}/{totalQ})</>
          )}
        </button>
      </div>
    </div>
  )
}
