import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getJson, postJson } from '../../lib/api'
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Sparkles, TrendingDown, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SubjectScore = { subject: string; avgScore: number; attempts: number }

type Performance = {
  examScore: number | null
  attendanceRate: number | null
  quizAttempts: number
  courseProgress: number | null
  subjectScores: SubjectScore[]
  weakestSubject: string | null
  hasData: boolean
}

type PredictResult = {
  failure_risk?: number | string
  recommended_topic?: string
  study_strategy?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskLevel(raw: number | string | undefined): {
  label: string; color: string; bg: string; border: string; icon: 'ok' | 'warn' | 'danger'
} {
  const v = typeof raw === 'string' ? parseFloat(raw) : (raw ?? 0)
  if (v >= 0.6) return { label: 'High Risk', color: 'text-rose-400', bg: 'bg-rose-500/[0.08]', border: 'border-rose-500/20', icon: 'danger' }
  if (v >= 0.3) return { label: 'Moderate Risk', color: 'text-amber-400', bg: 'bg-amber-500/[0.08]', border: 'border-amber-500/20', icon: 'warn' }
  return { label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-500/[0.08]', border: 'border-green-500/20', icon: 'ok' }
}

// ─── Result modal ─────────────────────────────────────────────────────────────

function ResultModal({
  result,
  studentName,
  weakestSubject,
  subjectScores,
  onClose,
}: {
  result: PredictResult
  studentName: string
  weakestSubject: string | null
  subjectScores: SubjectScore[]
  onClose: () => void
}) {
  const risk = riskLevel(result.failure_risk)
  const riskPct = Math.round(
    (typeof result.failure_risk === 'string'
      ? parseFloat(result.failure_risk)
      : (result.failure_risk ?? 0)) * 100,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`w-full max-w-md rounded-2xl border ${risk.border} bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            {risk.icon === 'ok' && <CheckCircle className="h-6 w-6 text-green-400 shrink-0" />}
            {risk.icon === 'warn' && <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />}
            {risk.icon === 'danger' && <TrendingDown className="h-6 w-6 text-rose-400 shrink-0" />}
            <div>
              <h2 className="text-base font-bold text-white">
                {studentName}
                {risk.icon === 'ok' && ' is doing great!'}
                {risk.icon === 'warn' && ' needs some attention.'}
                {risk.icon === 'danger' && ' is at risk of failing.'}
              </h2>
              <p className={`text-sm font-semibold ${risk.color}`}>{risk.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1 text-slate-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Failure risk bar */}
          <div className={`rounded-xl border ${risk.border} px-4 py-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Failure Risk</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${risk.icon === 'ok' ? 'bg-green-500' : risk.icon === 'warn' ? 'bg-amber-400' : 'bg-rose-500'}`}
                  style={{ width: `${riskPct}%` }}
                />
              </div>
              <span className={`shrink-0 text-sm font-bold ${risk.color}`}>{riskPct}%</span>
            </div>
          </div>

          {/* Subject scores — only shown if real data */}
          {subjectScores.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Subject Performance (from real exams)
              </p>
              {subjectScores.map((s, i) => {
                const barColor = s.avgScore >= 70 ? 'bg-green-500' : s.avgScore >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                const textColor = s.avgScore >= 70 ? 'text-green-400' : s.avgScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                return (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-300">{s.subject}</span>
                        {i === 0 && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-rose-900/30 text-rose-400 border border-rose-700/30">Weakest</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600">{s.attempts} exam{s.attempts !== 1 ? 's' : ''}</span>
                        <span className={`text-xs font-bold ${textColor}`}>{s.avgScore}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${s.avgScore}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Focus recommendation — only shown when we have a real weakest subject */}
          {weakestSubject && (
            <div className="rounded-xl border border-rose-700/30 bg-rose-900/10 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Recommended Focus
              </p>
              <p className="text-sm font-semibold text-white">{weakestSubject}</p>
              {subjectScores[0] && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Scoring {subjectScores[0].avgScore}% on average — needs the most improvement.
                </p>
              )}
            </div>
          )}

          {/* Study strategy from ML — only if provided */}
          {result.study_strategy && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">AI Study Strategy</p>
              <p className="text-sm text-slate-300">{result.study_strategy}</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function StudentSkillInsightPage() {
  const { role } = useParams()
  const { pathname } = useLocation()
  const base = `/app/${role ?? 'teacher'}`
  const sid = pathname.match(/\/students\/([^/]+)\/skill/)?.[1] ?? ''

  const [studentName, setStudentName] = useState('Student')
  const [perf, setPerf] = useState<Performance | null>(null)
  const [loadingPerf, setLoadingPerf] = useState(false)
  const [perfErr, setPerfErr] = useState<string | null>(null)

  // Only these two need manual input — the system can't know them
  const [studyHours, setStudyHours] = useState(8)
  const [loginFreq, setLoginFreq] = useState(10)

  const [result, setResult] = useState<PredictResult | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [predErr, setPredErr] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  // Load student name
  useEffect(() => {
    if (!sid) return
    let cancelled = false
    getJson<{ users: { _id: string; name: string }[] }>('/api/users?role=student&limit=200')
      .then((d) => {
        const u = d.users?.find((x) => x._id === sid)
        if (!cancelled && u?.name) setStudentName(u.name)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [sid])

  function loadPerformance() {
    if (!sid) return
    setLoadingPerf(true)
    setPerfErr(null)
    getJson<Performance>(`/api/users/${sid}/performance`)
      .then((p) => setPerf(p))
      .catch((e: Error) => setPerfErr(e.message))
      .finally(() => setLoadingPerf(false))
  }

  useEffect(() => { loadPerformance() }, [sid])

  async function runPredict() {
    if (!perf) return
    setRunning(true)
    setPredErr(null)
    try {
      const data = await postJson<PredictResult>('/api/skillup/predict', {
        exam_score: perf.examScore ?? 0,
        quiz_score: perf.examScore ?? 0,
        assignment_score: perf.examScore ?? 0,
        attendance_rate: perf.attendanceRate ?? 0,
        quiz_attempts: perf.quizAttempts,
        study_time_hours: studyHours,
        login_frequency: loginFreq,
        course_progress: perf.courseProgress ?? 0,
        topic_variables: 0,
        topic_loops: 0,
        topic_functions: 0,
        topic_oop: 0,
        topic_recursion: 0,
        topic_datastructures: 0,
      })
      setResult(data)
      setShowModal(true)
    } catch (e) {
      setPredErr(e instanceof Error ? e.message : 'Prediction failed')
    } finally {
      setRunning(false)
    }
  }

  const hasData = perf?.hasData ?? false
  const risk = result ? riskLevel(result.failure_risk) : null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Result modal */}
      {showModal && result && (
        <ResultModal
          result={result}
          studentName={studentName}
          weakestSubject={perf?.weakestSubject ?? null}
          subjectScores={perf?.subjectScores ?? []}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            Predict {studentName}'s Learning Outcome
          </h1>
          <p className="text-sm text-slate-500">
            AI analysis based on {studentName}'s real exam performance.
          </p>
        </div>
        <Link
          to={`${base}/students`}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/[0.08] transition-colors"
        >
          ← Students
        </Link>
      </div>

      {/* Loading */}
      {loadingPerf && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-green-400" />
          <span className="text-sm text-slate-400">Loading {studentName}'s performance data…</span>
        </div>
      )}

      {/* Fetch error */}
      {perfErr && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Could not load data: {perfErr}
        </div>
      )}

      {/* No data yet */}
      {!loadingPerf && !perfErr && perf && !hasData && (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#111111] px-6 py-12 text-center space-y-2">
          <p className="text-base font-semibold text-slate-300">
            {studentName} hasn't taken any exams yet
          </p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Once {studentName} submits exams or attends classes, this page will
            auto-populate with real data and the prediction will become available.
          </p>
          <button
            onClick={loadPerformance}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      )}

      {/* Has real data */}
      {!loadingPerf && !perfErr && perf && hasData && (
        <>
          {/* Live data banner */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-green-700/20 bg-green-900/10 px-4 py-3">
            <p className="text-sm text-green-400">
              Live data · {perf.quizAttempts} exam{perf.quizAttempts !== 1 ? 's' : ''} submitted
            </p>
            <button
              type="button"
              onClick={loadPerformance}
              className="flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ['Avg Score', perf.examScore !== null ? `${perf.examScore}%` : '—',
                perf.examScore !== null
                  ? perf.examScore >= 70 ? 'text-green-400' : perf.examScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                  : 'text-slate-500'],
              ['Attendance', perf.attendanceRate !== null ? `${perf.attendanceRate}%` : '—',
                perf.attendanceRate !== null
                  ? perf.attendanceRate >= 80 ? 'text-green-400' : perf.attendanceRate >= 60 ? 'text-amber-400' : 'text-rose-400'
                  : 'text-slate-500'],
              ['Exams Taken', String(perf.quizAttempts), 'text-slate-300'],
              ['Progress', perf.courseProgress !== null ? `${perf.courseProgress}%` : '—', 'text-slate-300'],
            ] as [string, string, string][]).map(([label, val, cls]) => (
              <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${cls}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Per-subject breakdown */}
          {perf.subjectScores.length > 0 && (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Subject Breakdown
                </h2>
                {perf.weakestSubject && (
                  <span className="rounded-lg border border-rose-700/30 bg-rose-900/10 px-2.5 py-1 text-[10px] font-semibold text-rose-400">
                    Focus: {perf.weakestSubject}
                  </span>
                )}
              </div>
              {perf.subjectScores.map((s, i) => {
                const barColor = s.avgScore >= 70 ? 'bg-green-500' : s.avgScore >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                const textColor = s.avgScore >= 70 ? 'text-green-400' : s.avgScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                return (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-300">{s.subject}</span>
                        {i === 0 && (
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-rose-900/30 text-rose-400 border border-rose-700/30">
                            weakest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600">
                          {s.attempts} exam{s.attempts !== 1 ? 's' : ''}
                        </span>
                        <span className={`text-xs font-bold ${textColor}`}>{s.avgScore}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${s.avgScore}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Teacher context inputs */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Additional Context
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                These can't be tracked automatically — estimate if unsure.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="text-xs font-semibold text-slate-300">Study Hours / week</span>
                <p className="text-[10px] text-slate-600 mb-1.5">
                  How many hours does {studentName} study per week?
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={studyHours}
                    onChange={(e) => setStudyHours(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2.5 py-1.5 text-sm text-white outline-none focus:border-green-500/50"
                  />
                  <span className="shrink-0 text-xs text-slate-500">h</span>
                </div>
              </label>
              <label className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="text-xs font-semibold text-slate-300">Login Frequency / month</span>
                <p className="text-[10px] text-slate-600 mb-1.5">
                  Approximate times {studentName} logs in this month
                </p>
                <input
                  type="number"
                  min={0}
                  value={loginFreq}
                  onChange={(e) => setLoginFreq(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2.5 py-1.5 text-sm text-white outline-none focus:border-green-500/50"
                />
              </label>
            </div>
          </div>

          {predErr && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {predErr}
            </div>
          )}

          {/* Predict + result badge */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void runPredict()}
              disabled={running || !sid}
              className="flex items-center gap-2 rounded-xl bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors shadow-lg shadow-green-900/30"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {running ? 'Running model…' : 'Run AI Prediction'}
            </button>

            {result && !showModal && risk && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${risk.border} ${risk.color} hover:opacity-80`}
              >
                {risk.icon === 'ok' && <CheckCircle className="h-4 w-4" />}
                {risk.icon === 'warn' && <AlertTriangle className="h-4 w-4" />}
                {risk.icon === 'danger' && <TrendingDown className="h-4 w-4" />}
                {risk.label} — view results
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
