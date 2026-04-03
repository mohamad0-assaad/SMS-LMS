import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  TrendingUp,
} from 'lucide-react'
import { AIGradientCard } from '../components/dashboard/AIGradientCard'
import { QuickActionButton } from '../components/dashboard/QuickActionButton'
import { StatCard } from '../components/dashboard/StatCard'

const timetable = [
  { time: '08:00 – 09:00', subject: 'Mathematics', room: 'Room 204' },
  { time: '09:15 – 10:15', subject: 'Computer Science', room: 'Lab B' },
  { time: '10:30 – 11:30', subject: 'Physics', room: 'Room 112' },
]

const results = [
  { name: 'OOP Quiz', date: 'Mar 26', score: '88%' },
  { name: 'Data Structures', date: 'Mar 20', score: '76%' },
  { name: 'Linear Algebra', date: 'Mar 12', score: '91%' },
]

export function StudentDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today’s classes" value={3} icon={GraduationCap} />
        <StatCard title="Upcoming exams" value={2} icon={ClipboardList} />
        <StatCard
          title="Average score"
          value="84%"
          icon={TrendingUp}
          trend={{ text: '+6% vs last month', positive: true }}
        />
        <StatCard title="Attendance" value="92%" icon={BookOpen} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Today’s timetable</h2>
            <span className="text-xs font-medium text-violet-600">View week</span>
          </div>
          <ul className="mt-4 space-y-3">
            {timetable.map((row) => (
              <li
                key={row.time}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.subject}</p>
                  <p className="text-xs text-slate-500">{row.time}</p>
                </div>
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                  {row.room}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="lg:col-span-2">
          <AIGradientCard
            variant="purple"
            eyebrow="AI Study Coach"
            title="Personalized for you"
            actionLabel="Start study session"
          >
            <p>
              Hi! You are doing great in <strong className="text-white">OOP</strong>. Next
              focus: <strong className="text-white">Loops</strong> — short practice sets and
              remedial notes are ready based on your last quiz.
            </p>
          </AIGradientCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">Recent results</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {results.map((r) => (
              <li key={r.name} className="flex items-center justify-between py-3 first:pt-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.date}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {r.score}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <QuickActionButton icon={ClipboardList} label="Take mock quiz" />
            <QuickActionButton icon={BookOpen} label="Download notes" />
            <QuickActionButton icon={MessageCircle} label="Ask AI doubt" />
          </div>
        </section>
      </div>
    </div>
  )
}
