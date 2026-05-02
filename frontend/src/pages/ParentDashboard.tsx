import { useState } from 'react'
import {
  BarChart3,
  BookOpen,
  Calendar,
  Download,
  Mail,
  MessageSquare,
  Trophy,
} from 'lucide-react'
import { AIGradientCard } from '../components/dashboard/AIGradientCard'
import { MiniLineChart } from '../components/dashboard/MiniLineChart'
import { QuickActionButton } from '../components/dashboard/QuickActionButton'
import { StatCard } from '../components/dashboard/StatCard'

const children = ['Ahmed Ali', 'Zain Ali']

const trend = [
  { week: 'W1', child: 62, klass: 70 },
  { week: 'W2', child: 68, klass: 71 },
  { week: 'W3', child: 74, klass: 72 },
  { week: 'W4', child: 80, klass: 73 },
  { week: 'W5', child: 86, klass: 74 },
]

const exams = [
  { name: 'CS Quiz', rating: 'Excellent', score: '92%' },
  { name: 'Math Unit Test', rating: 'Great', score: '86%' },
  { name: 'Physics Lab', rating: 'Good', score: '81%' },
]

export function ParentDashboard() {
  const [activeChild, setActiveChild] = useState(0)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap gap-2">
        {children.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveChild(i)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              i === activeChild
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                : 'bg-white/[0.06] text-slate-400 ring-1 ring-white/[0.08] hover:bg-white/[0.10] hover:text-white'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Average score" value="86%" icon={BarChart3} />
        <StatCard title="Attendance" value="94%" icon={BookOpen} />
        <StatCard title="Class rank" value="#5" icon={Trophy} sub="of 32" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-lg lg:col-span-3">
          <h2 className="text-base font-semibold text-white">Performance overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            {children[activeChild]} — score vs class average (weekly)
          </p>
          <div className="mt-4 min-h-[240px]">
            <MiniLineChart
              data={trend}
              xKey="week"
              yDomain={[50, 100]}
              ariaLabel="Child score versus class average"
              series={[
                { key: 'child', name: 'Your child', color: '#7c3aed' },
                { key: 'klass', name: 'Class avg', color: '#94a3b8', dashed: true },
              ]}
            />
          </div>
        </section>

        <div className="lg:col-span-2">
          <AIGradientCard
            variant="teal"
            eyebrow="AI insights"
            title={`For ${children[activeChild].split(' ')[0]}`}
            actionLabel="View study plan"
          >
            <p>
              <strong className="text-white">Strengths:</strong> consistent homework completion,
              strong quiz recovery after feedback.
            </p>
            <p className="mt-2">
              <strong className="text-white">Focus:</strong> recursion &amp; tree traversals —
              practice sets align with class pacing.
            </p>
          </AIGradientCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-lg lg:col-span-3">
          <h2 className="text-base font-semibold text-white">Recent exams</h2>
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {exams.map((e) => (
              <li key={e.name} className="flex items-center justify-between py-3 first:pt-0">
                <div>
                  <p className="text-sm font-medium text-white">{e.name}</p>
                  <p className="text-xs font-medium text-violet-400">{e.rating}</p>
                </div>
                <span className="text-sm font-semibold text-slate-200">{e.score}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-lg lg:col-span-2">
          <h2 className="text-base font-semibold text-white">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <QuickActionButton icon={Download} label="Download report card" />
            <QuickActionButton icon={Mail} label="Contact teachers" />
            <QuickActionButton icon={Calendar} label="View full timetable" />
            <QuickActionButton icon={MessageSquare} label="Book parent meeting" />
          </div>
        </section>
      </div>
    </div>
  )
}
