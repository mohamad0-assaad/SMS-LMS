import {
  CalendarDays,
  ClipboardList,
  ListOrdered,
  School,
  UserPlus,
  Users,
} from 'lucide-react'
import { AIGradientCard } from '../components/dashboard/AIGradientCard'
import { MiniLineChart } from '../components/dashboard/MiniLineChart'
import { QuickActionButton } from '../components/dashboard/QuickActionButton'
import { StatCard } from '../components/dashboard/StatCard'

/** Normalized to 0–100 for one chart: enrollment index + pass rate % */
const growth = [
  { month: 'Jan', enrollment: 68, pass: 72 },
  { month: 'Feb', enrollment: 72, pass: 74 },
  { month: 'Mar', enrollment: 77, pass: 76 },
  { month: 'Apr', enrollment: 84, pass: 79 },
  { month: 'May', enrollment: 90, pass: 81 },
  { month: 'Jun', enrollment: 94, pass: 83 },
]

const activity = [
  { time: '10:42', text: 'New exam created — Grade 11 CS' },
  { time: '09:18', text: 'User registered (teacher)' },
  { time: 'Yesterday', text: 'Timetable updated for Term 2' },
  { time: 'Yesterday', text: 'Subject “Physics” edited' },
]

export function AdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total students" value="1,240" icon={Users} />
        <StatCard title="Teachers" value={64} icon={School} />
        <StatCard title="Active classes" value={36} icon={School} />
        <StatCard title="Exams conducted" value={89} icon={ClipboardList} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">System overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enrollment trend index vs exam pass rate (both scaled 0–100 for comparison)
          </p>
          <div className="mt-4 min-h-[240px]">
            <MiniLineChart
              data={growth}
              xKey="month"
              yDomain={[60, 100]}
              ariaLabel="Enrollment and pass rate trends"
              series={[
                { key: 'enrollment', name: 'Enrollment index', color: '#7c3aed' },
                { key: 'pass', name: 'Exam pass %', color: '#0d9488' },
              ]}
            />
          </div>
        </section>

        <div className="lg:col-span-2">
          <AIGradientCard variant="purple" eyebrow="AI Insights" title="Signals across the school">
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="text-white">42</strong> students flagged at-risk this week
              </li>
              <li>
                Hardest topic: <strong className="text-white">Recursion</strong> (avg 54%)
              </li>
              <li>Recommended: schedule targeted review sessions in CS Grade 11.</li>
            </ul>
          </AIGradientCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {activity.map((a) => (
              <li
                key={a.text}
                className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <span className="shrink-0 text-xs font-semibold text-violet-600">{a.time}</span>
                <p className="text-sm text-slate-700">{a.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <QuickActionButton icon={UserPlus} label="Add new user" />
            <QuickActionButton icon={School} label="Create class" />
            <QuickActionButton icon={CalendarDays} label="Generate timetable" />
            <QuickActionButton icon={ListOrdered} label="View activity logs" />
          </div>
        </section>
      </div>
    </div>
  )
}
