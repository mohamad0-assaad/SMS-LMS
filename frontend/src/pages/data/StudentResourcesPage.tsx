import { BookOpen, ClipboardList, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export function StudentResourcesPage() {
  const { role } = useParams()
  const base = `/app/${role ?? 'student'}`

  const items = [
    {
      title: 'Timetable',
      desc: "Today's periods and the full week for your class.",
      to: `${base}/timetable`,
      icon: BookOpen,
    },
    {
      title: 'Exams',
      desc: 'See assessments published for your class.',
      to: `${base}/exams`,
      icon: ClipboardList,
    },
    {
      title: 'AI study coach',
      desc: 'Short, practical answers to your questions.',
      to: `${base}/ai-coach`,
      icon: Sparkles,
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Resources</h1>
        <p className="text-sm text-slate-500">Jump to live sections of the student app.</p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.title}>
            <Link
              to={item.to}
              className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-5 shadow-lg transition hover:border-green-500/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                <item.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="font-semibold text-white">{item.title}</span>
                <span className="mt-1 block text-sm text-slate-400">{item.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
