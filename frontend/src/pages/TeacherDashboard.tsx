import { AlertTriangle, Bell, CheckCircle, Clock, RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MiniLineChart } from '../components/dashboard/MiniLineChart'
import { getJson } from '../lib/api'

const weeklyTrend = [
  { week: 'Week 1', avg: 68 },
  { week: 'Week 2', avg: 72 },
  { week: 'Week 3', avg: 70 },
  { week: 'Week 4', avg: 74 },
]

const atRiskStudents = [
  { name: 'Julian Martinez', subject: 'Calculus', score: 58, level: 'critical', trigger: 'Score < 60% in Calculus' },
  { name: 'Sarah Chen',      subject: 'Algebra',  score: 59, level: 'warning',  trigger: 'Score < 60% in Algebra' },
  { name: 'Leo Thompson',    subject: 'Geometry', score: 62, level: 'warning',  trigger: 'Consistent trend < 65%' },
]

const heatmap = [
  { topic: 'Linear Algebra Fundamentals',    avg: 78, a: 89, b: 72, c: 74, status: 'complete' },
  { topic: 'Geometry & Spatial Reasoning',   avg: 54, a: 68, b: 42, c: 52, status: 'in-progress' },
  { topic: 'Calculus: Limits & Derivatives', avg: 92, a: 94, b: 91, c: 91, status: 'scheduled' },
]

function pctBadge(n: number) {
  if (n < 60) return 'bg-rose-500/20 text-rose-400'
  if (n < 85) return 'bg-amber-500/20 text-amber-400'
  return 'bg-teal-500/20 text-teal-400'
}

function avgColor(n: number) {
  if (n < 60) return 'text-rose-400'
  if (n < 85) return 'text-amber-400'
  return 'text-teal-400'
}

type TeacherStats = { myClassesCount?: number; totalStudentsInMyClasses?: number; pendingGrading?: number; nextClass?: string }

export function TeacherDashboard() {
  const { role } = useParams()
  const navigate = useNavigate()
  const base = `/app/${role ?? 'teacher'}`
  const [stats, setStats] = useState<TeacherStats | null>(null)

  useEffect(() => {
    let c = false
    getJson<TeacherStats>('/api/dashboard/stats')
      .then((s) => { if (!c) setStats(s) })
      .catch(() => {})
    return () => { c = true }
  }, [])

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ minHeight: 160 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0d2044] to-[#0f2a3a]" />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="absolute right-0 top-0 h-full w-2/5 bg-gradient-to-l from-teal-600/20 to-transparent" />
        <div className="relative p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400">
            New Update
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white">Elevate Your Teaching Strategy</h1>
          <p className="mt-1.5 text-sm text-slate-400">AI-powered class insights to help every student succeed.</p>
          <button
            type="button"
            onClick={() => navigate(`${base}/ai-insights`)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/40 transition hover:bg-teal-400"
          >
            <Sparkles className="h-4 w-4" /> Explore AI Insights
          </button>
        </div>
      </div>

      {/* Overview header */}
      <div>
        <h2 className="text-lg font-bold text-white">Dashboard Overview</h2>
        <p className="mt-0.5 text-sm text-slate-500">Spring Semester 2024 • Section 12-B Analytics</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-400">Class Average Score</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
              <TrendingUp className="h-4 w-4 text-teal-400" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">74%</p>
          <p className="mt-1 text-xs font-medium text-teal-400">+2.4% vs last mo.</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-400">Active Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{stats?.totalStudentsInMyClasses ?? '—'}</p>
          <p className="mt-1 text-xs text-slate-500">Across {stats?.myClassesCount ?? '—'} class{stats?.myClassesCount !== 1 ? 'es' : ''}</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-400">At-Risk Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">3</p>
          <p className="mt-1 text-xs font-medium text-amber-400">Requires attention</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-400">Topic Completion Rate</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Bell className="h-4 w-4 text-violet-400" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">82%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: '82%' }} />
          </div>
        </div>
      </div>

      {/* Performance chart + At-Risk */}
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Class Performance Trend</h3>
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-400">Last 4 Weeks</span>
          </div>
          <div className="mt-5 min-h-[220px]">
            <MiniLineChart
              data={weeklyTrend}
              xKey="week"
              yDomain={[0, 100]}
              ariaLabel="Class average score by week"
              series={[{ key: 'avg', name: 'Class average', color: '#14b8a6' }]}
            />
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 shadow-lg lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Bell className="h-4 w-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">At-Risk Alerts</h3>
          </div>
          <ul className="mt-3 space-y-2">
            {atRiskStudents.map((s) => (
              <li key={s.name} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className={`text-xs font-medium ${s.level === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {s.subject} • {s.score}% Score
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">Triggered: {s.trigger}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    s.level === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {s.level}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigate(`${base}/students`)}
            className="mt-4 text-xs font-semibold text-teal-400 hover:underline"
          >
            View All Alerts (8)
          </button>
        </section>
      </div>

      {/* Topic Difficulty Heatmap */}
      <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Topic Difficulty Heatmap</h3>
            <p className="mt-0.5 text-xs text-slate-500">Class comprehension levels across key curriculum modules</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />&lt;60%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />60–85%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-400" />85%+</span>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Topic Area', 'Total Avg', 'Cohort A', 'Cohort B', 'Cohort C', 'Completion Status'].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {heatmap.map((row) => (
                <tr key={row.topic} className="transition hover:bg-white/[0.02]">
                  <td className="py-4 pr-6 text-sm font-medium text-white">{row.topic}</td>
                  <td className="py-4 pr-4">
                    <span className={`text-sm font-bold ${avgColor(row.avg)}`}>{row.avg}%</span>
                  </td>
                  {[row.a, row.b, row.c].map((v, i) => (
                    <td key={i} className="py-4 pr-4">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${pctBadge(v)}`}>{v}%</span>
                    </td>
                  ))}
                  <td className="py-4">
                    {row.status === 'complete' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-teal-400">
                        <CheckCircle className="h-3.5 w-3.5" /> Complete
                      </span>
                    )}
                    {row.status === 'in-progress' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                        <RefreshCw className="h-3.5 w-3.5" /> In Progress
                      </span>
                    )}
                    {row.status === 'scheduled' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Clock className="h-3.5 w-3.5" /> Scheduled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Quick Access */}
      <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-[#1a1040] via-[#1e1356] to-[#0f0a2e] p-5 shadow-lg">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-600/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">AI Exam Generator</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-white">Draft an assessment in seconds</h3>
            <p className="mt-0.5 text-xs text-slate-400">Pick class, subject &amp; topic — Gemini generates questions instantly.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${base}/ai/exam`)}
            className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500"
          >
            Open AI Exam Generator
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="pb-2 text-center text-xs text-slate-600">
        Data updated today at {now}. Next sync in 2 hours.
      </p>
    </div>
  )
}
