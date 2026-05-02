import { BookOpen, ClipboardList, GraduationCap, MessageCircle, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StatCard } from '../components/dashboard/StatCard'
import { getJson, getProfile, type LoginUser } from '../lib/api'

type Pop = { name?: string } | string
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

const subjectColors = [
  'bg-teal-500/10 text-teal-400',
  'bg-violet-500/10 text-violet-400',
  'bg-blue-500/10 text-blue-400',
  'bg-amber-500/10 text-amber-400',
]

export function StudentDashboard() {
  const { role } = useParams()
  const navigate = useNavigate()
  const base = `/app/${role ?? 'student'}`
  const [profile, setProfile] = useState<LoginUser | null>(null)
  const [tt, setTt] = useState<TimetableDoc | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard color="teal"   title="Today's classes"  value={todayRows.length} icon={GraduationCap} />
        <StatCard color="violet" title="Upcoming exams"   value={stats?.pendingAssignments ?? '—'} icon={ClipboardList} />
        <StatCard
          color="blue"
          title="Average score"
          value={avgPct != null ? `${avgPct}%` : '—'}
          icon={TrendingUp}
          trend={results.length ? { text: 'From recent graded work', positive: (avgPct ?? 0) >= 60 } : undefined}
        />
        <StatCard color="amber"  title="Attendance"       value={stats?.myAttendance ?? '—'} icon={BookOpen} />
      </div>

      {/* Timetable + AI Coach */}
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Today's Schedule</h2>
              <p className="mt-0.5 text-xs text-slate-500">{todayName}</p>
            </div>
            <button type="button" onClick={() => navigate(`${base}/timetable`)} className="text-xs font-medium text-teal-400 hover:underline">
              Full week →
            </button>
          </div>
          {!profile?.studentClass ? (
            <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-400">
              No class assigned yet — contact your administrator.
            </p>
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
          <div className="relative h-full overflow-hidden rounded-xl border border-teal-500/20 bg-gradient-to-br from-[#071e1e] via-[#0a2828] to-[#071a1a] p-5 shadow-lg">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-500/15 blur-3xl" />
            <div className="absolute -bottom-6 left-0 h-20 w-20 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">AI Study Coach</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-white">Personalized for you</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed flex-1">
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
                className="mt-4 w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white transition hover:bg-teal-500"
              >
                Start Study Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results + Quick Actions */}
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Results</h2>
            <button type="button" onClick={() => navigate(`${base}/results`)} className="text-xs font-medium text-teal-400 hover:underline">
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

        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg lg:col-span-2">
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
                <Icon className="h-4 w-4 text-teal-400 shrink-0" strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
