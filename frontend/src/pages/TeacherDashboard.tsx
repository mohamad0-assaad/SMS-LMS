import { ClipboardCheck, ClipboardList, Upload, Users } from 'lucide-react'
import { AIGradientCard } from '../components/dashboard/AIGradientCard'
import { MiniBarChart } from '../components/dashboard/MiniBarChart'
import { QuickActionButton } from '../components/dashboard/QuickActionButton'
import { StatCard } from '../components/dashboard/StatCard'

const performance = [
  { section: '10 A', score: 72, attendance: 88 },
  { section: '10 B', score: 68, attendance: 84 },
  { section: '11 A', score: 81, attendance: 91 },
  { section: '11 B', score: 77, attendance: 86 },
]

const recentExams = [
  { name: 'Midterm — Data Structures', status: 'Grading' as const },
  { name: 'Quiz — Algorithms', status: 'Completed' as const },
  { name: 'Lab Practical', status: 'Grading' as const },
]

export function TeacherDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My classes" value={4} icon={Users} />
        <StatCard title="Total students" value={98} icon={Users} />
        <StatCard title="Active exams" value={2} icon={ClipboardList} />
        <StatCard title="Pending grading" value={24} icon={ClipboardCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">Class performance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Average score vs attendance by section
          </p>
          <div className="mt-4 min-h-[220px]">
            <MiniBarChart
              data={performance.map((p) => ({
                label: p.section,
                score: p.score,
                attendance: p.attendance,
              }))}
            />
          </div>
        </section>

        <div className="lg:col-span-2">
          <AIGradientCard variant="navy" eyebrow="AI Exam Generator" title="Draft an assessment">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-400">
                Class
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400">
                  <option className="text-slate-900">11 A — CS</option>
                  <option className="text-slate-900">10 B — CS</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-400">
                Topic
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400">
                  <option className="text-slate-900">Data Structures</option>
                  <option className="text-slate-900">OOP</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-400">
                Question count
                <input
                  type="number"
                  defaultValue={20}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </label>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Generate exam paper
            </button>
          </AIGradientCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">Recent exams</h2>
          <ul className="mt-4 space-y-3">
            {recentExams.map((ex) => (
              <li
                key={ex.name}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-900">{ex.name}</p>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    ex.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {ex.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <QuickActionButton icon={ClipboardList} label="Create new exam" />
            <QuickActionButton icon={Users} label="View all students" />
            <QuickActionButton icon={Upload} label="Upload materials" />
          </div>
        </section>
      </div>
    </div>
  )
}
