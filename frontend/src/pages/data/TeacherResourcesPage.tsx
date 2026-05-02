import { Link, useParams } from 'react-router-dom'

export function TeacherResourcesPage() {
  const { role } = useParams()
  const base = `/app/${role ?? 'teacher'}`

  const cards = [
    {
      title: 'AI exam generator',
      desc: 'Build a draft exam from a topic and difficulty using Gemini.',
      to: `${base}/ai/exam`,
      accent: 'from-teal-500/15 to-emerald-500/10',
    },
    {
      title: 'Class insights',
      desc: 'Summaries and quiz ideas from your class roster.',
      to: `${base}/ai-insights`,
      accent: 'from-violet-500/15 to-indigo-500/10',
    },
    {
      title: 'All exams',
      desc: 'List, publish, and open individual exams.',
      to: `${base}/exams`,
      accent: 'from-sky-500/15 to-blue-500/10',
    },
    {
      title: 'Students',
      desc: 'Roster and SkillUp performance view per student.',
      to: `${base}/students`,
      accent: 'from-amber-500/15 to-orange-500/10',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Resources</h1>
        <p className="text-sm text-slate-500">
          Quick links to the tools that use live API data for your role.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className={`group rounded-2xl border border-white/[0.08] bg-gradient-to-br ${c.accent} p-5 shadow-lg transition hover:border-teal-500/30`}
          >
            <h2 className="font-semibold text-white group-hover:text-teal-300">{c.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{c.desc}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-teal-400">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
