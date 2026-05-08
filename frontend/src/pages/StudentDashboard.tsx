import { BookOpen, ClipboardList, GraduationCap, MessageCircle, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StatCard } from '../components/dashboard/StatCard'
import { getJson, getProfile, type LoginUser } from '../lib/api'

type Pop = { name?: string } | string

type StudentPrediction = {
  failure_risk?: number | string
  recommended_topic?: string
  study_strategy?: string
}
type StudentSubjectScore = { subject: string; avgScore: number; attempts: number }
type StudentPerformance = {
  subjectScores: StudentSubjectScore[]
  weakestSubject: string | null
  hasData: boolean
}
type Period = { startTime?: string; endTime?: string; subject?: Pop }
type DaySchedule = { day: string; periods: Period[] }
type TimetableDoc = { schedule: DaySchedule[] }
type ResultRow = { _id: string; score: number; maxScore: number; examTitle: string; submittedAt?: string }
type StudentStats = { pendingAssignments?: number; myAttendance?: string; nextExam?: string }

function label(p: Pop | undefined): string {
  if (p == null) return '—'
  if (typeof p === 'string') return p
  return p.name ?? '—'
}

function riskLevel(raw: number | string | undefined) {
  const value = typeof raw === 'string' ? Number(raw) : raw ?? 0
  if (value >= 0.6) return { label: 'High Risk', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  if (value >= 0.3) return { label: 'Moderate Risk', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  return { label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' }
}

const subjectColors = [
  'bg-green-500/10 text-green-400',
  'bg-emerald-500/10 text-emerald-400',
  'bg-green-600/10 text-green-300',
  'bg-green-700/10 text-green-400',
]

export function StudentDashboard() {
  const { role } = useParams()
  const navigate = useNavigate()
  const base = `/app/${role ?? 'student'}`
  const [profile, setProfile] = useState<LoginUser | null>(null)
  const [tt, setTt] = useState<TimetableDoc | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [prediction, setPrediction] = useState<StudentPrediction | null>(null)
  const [predictionPerformance, setPredictionPerformance] = useState<StudentPerformance | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionError, setPredictionError] = useState<string | null>(null)

  useEffect(() => { getProfile().then(setProfile) }, [])

  useEffect(() => {
    const classId = profile?.studentClass
    if (!classId) return
    let c = false
    getJson<TimetableDoc>(`/api/timetables/${classId}`).then((d) => { if (!c) setTt(d) }).catch(() => {})
    return () => { c = true }
  }, [profile?.studentClass])

  useEffect(() => {
    let c = false
    getJson<ResultRow[]>('/api/exams/my-results').then((r) => { if (!c) setResults(Array.isArray(r) ? r.slice(0, 5) : []) }).catch(() => {})
    getJson<StudentStats>('/api/dashboard/stats').then((s) => { if (!c) setStats(s) }).catch(() => {})
    return () => { c = true }
  }, [])

  async function loadPrediction() {
    if (!profile || profile.role !== 'student') return
    setPredictionLoading(true)
    setPredictionError(null)
    try {
      const data = await getJson<{ performance?: StudentPerformance; prediction?: StudentPrediction | null }>('/api/users/me/prediction')
      setPrediction(data.prediction ?? null)
      setPredictionPerformance(data.performance ?? null)
    } catch (error) {
      setPredictionError(error instanceof Error ? error.message : 'Prediction failed')
      setPrediction(null)
      setPredictionPerformance(null)
    } finally {
      setPredictionLoading(false)
    }
  }

  const todayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), [])
  const todayRows = useMemo(() => {
    const day = tt?.schedule?.find((d) => d.day === todayName)
    return day?.periods ?? []
  }, [tt, todayName])

  const avgPct = useMemo(() => {
    if (!results.length) return null
    const vals = results.filter((r) => r.maxScore > 0).map((r) => (r.score / r.maxScore) * 100)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }, [results])

  const predictionRisk = prediction ? riskLevel(prediction.failure_risk) : null
  const predictionRiskPct = prediction ? Math.round((typeof prediction.failure_risk === 'string' ? Number(prediction.failure_risk) : Number(prediction.failure_risk ?? 0)) * 100) : null

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard color="green"  title="Today's classes"  value={todayRows.length} icon={GraduationCap} />
        <StatCard color="green"  title="Upcoming exams"   value={stats?.pendingAssignments ?? '—'} icon={ClipboardList} />
        <StatCard
          color="green"
          title="Average score"
          value={avgPct != null ? `${avgPct}%` : '—'}
          icon={TrendingUp}
          trend={results.length ? { text: 'From recent graded work', positive: (avgPct ?? 0) >= 60 } : undefined}
        />
        <StatCard color="amber"  title="Attendance"       value={stats?.myAttendance ?? '—'} icon={BookOpen} />
      </div>

      {/* Timetable + AI Coach */}
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-white/[0.06] bg-[#111111] p-6 shadow-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Today's Schedule</h2>
              <p className="mt-0.5 text-xs text-slate-500">{todayName}</p>
            </div>
            <button type="button" onClick={() => navigate(`${base}/timetable`)} className="text-xs font-medium text-green-400 hover:underline">
              Full week →
            </button>
          </div>
          {!profile?.studentClass ? (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 space-y-2">
              <p className="text-xs text-amber-400 font-medium">No class assigned</p>
              <p className="text-xs text-amber-300">Ask your administrator to enroll you in a class. They should:</p>
              <ol className="text-xs text-amber-300 list-decimal list-inside space-y-1">
                <li>Go to Classes → Manage Class</li>
                <li>Add you in the "Students" section</li>
                <li>Click "Save Changes"</li>
              </ol>
            </div>
          ) : !todayRows.length ? (
            <p className="mt-4 text-sm text-slate-500">No periods for {todayName}.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {todayRows.map((row, i) => (
                <li
                  key={`${row.startTime}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${subjectColors[i % subjectColors.length]}`}>
                    {String(label(row.subject)).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{label(row.subject)}</p>
                    <p className="text-xs text-slate-500">{row.startTime ?? '—'} – {row.endTime ?? '—'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* AI Coach card */}
        <div className="lg:col-span-2">
          <div className="relative h-full overflow-hidden rounded-xl border border-green-500/20 bg-[#0d1a0d] p-5 shadow-lg">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-500/15 blur-3xl" />
            <div className="absolute -bottom-6 left-0 h-20 w-20 rounded-full bg-green-500/10 blur-2xl" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-green-400">AI Study Coach</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-white">Personalized for you</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Ask study questions, get explanations, and prepare for exams — powered by Gemini.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/[0.05] p-3 text-center">
                  <p className="text-lg font-bold text-white">{avgPct ?? '—'}{avgPct != null ? '%' : ''}</p>
                  <p className="text-[10px] text-slate-500">Avg Score</p>
                </div>
                <div className="rounded-lg bg-white/[0.05] p-3 text-center">
                  <p className="text-lg font-bold text-white">{results.length}</p>
                  <p className="text-[10px] text-slate-500">Exams Done</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`${base}/ai-coach`)}
                className="mt-4 w-full rounded-xl bg-green-700 py-2.5 text-xs font-bold text-white transition hover:bg-green-600"
              >
                Start Study Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prediction */}
      <section className="rounded-3xl border border-white/[0.08] bg-[#0f1720] p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">AI Performance Prediction</p>
            <h2 className="mt-2 text-2xl font-bold text-white">{profile?.name ?? 'You'} are at risk of failing.</h2>
            <p className="mt-2 text-sm text-slate-400">High Risk</p>
          </div>
          <button
            type="button"
            onClick={() => void loadPrediction()}
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            {predictionLoading ? 'Predicting…' : 'Run prediction'}
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Failure Risk</p>
            <p className="mt-4 text-5xl font-bold text-white">
              {predictionRiskPct != null ? `${predictionRiskPct}%` : '--'}
            </p>
            <div className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${prediction ? predictionRisk?.bg : 'bg-slate-700/60'} ${prediction ? predictionRisk?.color : 'text-slate-300'}`}>
              {prediction ? predictionRisk?.label : 'Pending'}
            </div>

            {predictionPerformance?.subjectScores.length ? (
              <div className="mt-6 rounded-3xl border border-white/[0.07] bg-[#0b111c] p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">Subject Performance (from real exams)</p>
                <div className="space-y-3">
                  {predictionPerformance.subjectScores.map((subj, index) => (
                    <div key={subj.subject} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{subj.subject}</p>
                          {index === 0 && (
                            <span className="mt-1 inline-flex rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                              Weakest
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{subj.attempts} exam{subj.attempts !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-300">{subj.avgScore}%</p>
                        <div className="h-2.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className={`h-full rounded-full ${subj.avgScore >= 70 ? 'bg-emerald-400' : subj.avgScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${subj.avgScore}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">Subject performance appears after you run the prediction.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Recommended Focus</p>
              <p className="mt-3 text-xl font-semibold text-white">{predictionPerformance?.weakestSubject ?? prediction?.recommended_topic ?? 'Run prediction'}</p>
              <p className="mt-2 text-sm text-slate-400">Scoring {predictionPerformance?.subjectScores[0]?.avgScore ?? '--'}% on average — needs the most improvement.</p>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">AI Study Strategy</p>
              <p className="mt-3 text-sm font-semibold text-white">
                {prediction?.study_strategy ?? 'Run prediction to get study guidance.'}
              </p>
            </div>
          </div>
        </div>

        {predictionError && (
          <div className="mt-5 rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
            <p>{predictionError}</p>
          </div>
        )}
      </section>

      {/* Recent Results + Quick Actions */}
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-white/[0.06] bg-[#111111] p-6 shadow-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Results</h2>
            <button type="button" onClick={() => navigate(`${base}/results`)} className="text-xs font-medium text-green-400 hover:underline">
              All results →
            </button>
          </div>
          {!results.length ? (
            <p className="mt-4 text-sm text-slate-500">No graded submissions yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {results.map((r) => {
                const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0
                return (
                  <li key={r._id} className="space-y-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-white">{r.examTitle}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        pct >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                        pct >= 60 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{r.score} / {r.maxScore} points</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-[#111111] p-6 shadow-lg lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
          <div className="mt-3 space-y-2">
            {[
              { icon: ClipboardList, label: 'My exams',       to: `${base}/exams` },
              { icon: BookOpen,      label: 'Resources',      to: `${base}/resources` },
              { icon: MessageCircle, label: 'AI Study Coach', to: `${base}/ai-coach` },
            ].map(({ icon: Icon, label, to }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(to)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Icon className="h-4 w-4 text-green-400 shrink-0" strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
