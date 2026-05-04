import { Activity, AlertTriangle, CalendarDays, ClipboardList, ListOrdered, School, Sparkles, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { MiniLineChart } from '../components/dashboard/MiniLineChart'
import { StatCard } from '../components/dashboard/StatCard'
import { getJson } from '../lib/api'

const growth = [
  { month: 'Jan', enrollment: 68, pass: 72 },
  { month: 'Feb', enrollment: 72, pass: 74 },
  { month: 'Mar', enrollment: 77, pass: 76 },
  { month: 'Apr', enrollment: 84, pass: 79 },
  { month: 'May', enrollment: 90, pass: 81 },
  { month: 'Jun', enrollment: 94, pass: 83 },
]

const flagged = [
  { name: 'Julian Martinez', grade: '11', subject: 'Calculus', score: 58, level: 'critical' },
  { name: 'Sara Ahmed',      grade: '10', subject: 'Physics',  score: 61, level: 'warning' },
  { name: 'Liam Chen',       grade: '11', subject: 'CS',       score: 63, level: 'warning' },
]

type AdminStats = {
  totalStudents?: number
  totalTeachers?: number
  activeExams?: number
  activeClasses?: number
  avgAttendance?: string
  recentActivity?: string[]
}

export function AdminDashboard() {
  const { role } = useParams()
  const navigate = useNavigate()
  const base = `/app/${role ?? 'admin'}`
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    let cancelled = false
    getJson<AdminStats>('/api/dashboard/stats')
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const activity = stats?.recentActivity?.length
    ? stats.recentActivity.map((text, i) => ({
        text,
        dot: ['bg-teal-500', 'bg-violet-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500'][i % 5],
      }))
    : []

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard color="teal"   title="Total students"   value={stats?.totalStudents ?? '—'} icon={Users}         trend={stats?.totalStudents != null ? { text: 'Active enrolled students', positive: true } : undefined} />
        <StatCard color="violet" title="Teachers"         value={stats?.totalTeachers ?? '—'} icon={School} />
        <StatCard color="blue"   title="Active classes"   value={stats?.activeClasses ?? '—'} icon={School} />
        <StatCard color="amber"  title="Active exams"     value={stats?.activeExams ?? '—'}   icon={ClipboardList} />
      </div>

      {/* Chart + AI Insights */}
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">System Overview</h2>
              <p className="mt-0.5 text-xs text-slate-500">Enrollment trend vs exam pass rate (scaled 0–100)</p>
            </div>
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-400">Last 6 months</span>
          </div>
          <div className="mt-5 min-h-[220px]">
            <MiniLineChart
              data={growth}
              xKey="month"
              yDomain={[60, 100]}
              ariaLabel="Enrollment and pass rate trends"
              series={[
                { key: 'enrollment', name: 'Enrollment index', color: '#14b8a6' },
                { key: 'pass',       name: 'Exam pass %',      color: '#8b5cf6' },
              ]}
            />
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 shadow-lg lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">At-Risk Alerts</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">{flagged.length} students flagged this week</p>
          <ul className="mt-3 space-y-2">
            {flagged.map((s) => (
              <li key={s.name} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-slate-500">Grade {s.grade} · {s.subject} · {s.score}%</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    s.level === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>{s.level}</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-600">
                  Triggered: Score &lt; {s.level === 'critical' ? '60' : '65'}% in {s.subject}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-violet-500/20 bg-gradient-to-br from-[#1a1040] to-[#0f0a2e] p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300">AI Recommendation</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Schedule targeted review for Recursion — avg 54% in CS Grade 11.</p>
            <button
              type="button"
              onClick={() => navigate(`${base}/ai-insights`)}
              className="mt-2 text-xs font-medium text-violet-400 hover:underline"
            >
              Open AI Insights →
            </button>
          </div>
        </section>
      </div>

      {/* Activity + Quick Actions */}
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg lg:col-span-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No recent activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-1">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/[0.02]">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.dot}`} />
                  <p className="text-sm text-slate-200">{a.text}</p>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => navigate(`${base}/logs`)}
            className="mt-4 w-full rounded-lg border border-white/[0.04] py-2 text-xs font-semibold text-slate-500 transition hover:bg-white/[0.03] hover:text-slate-300"
          >
            View all activity logs →
          </button>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-[#111827] p-6 shadow-lg lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
          <div className="mt-3 space-y-2">
            {[
              { icon: UserPlus,     label: 'Add new user',        to: `${base}/users/register` },
              { icon: School,       label: 'Create class',         to: `${base}/classes/new` },
              { icon: CalendarDays, label: 'Generate timetable',  to: `${base}/timetable` },
              { icon: ListOrdered,  label: 'View activity logs',  to: `${base}/logs` },
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
