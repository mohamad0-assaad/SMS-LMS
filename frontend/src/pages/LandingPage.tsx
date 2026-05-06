import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Users,
    title: 'Student Information',
    desc: 'Profiles, classes, and enrollment in one place — structured for every school workflow.',
  },
  {
    icon: BookOpen,
    title: 'Learning Management',
    desc: 'Courses, materials, assignments, and quizzes with role-aware dashboards for every user.',
  },
  {
    icon: Brain,
    title: 'Adaptive Signals',
    desc: 'Topic-level insights and AI recommendations so teachers see who needs support instantly.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Ready',
    desc: 'Live KPI cards and performance charts designed for real metrics and reporting.',
  },
]

const roles = [
  {
    icon: GraduationCap,
    title: 'Students',
    desc: 'Track your classes, take AI-generated exams, view results and get personalized coaching.',
    img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80',
    color: 'from-green-500/20',
  },
  {
    icon: LayoutDashboard,
    title: 'Teachers',
    desc: 'Manage classes, generate AI exams with Gemini, publish assessments, and track at-risk students.',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    color: 'from-green-600/20',
  },
  {
    icon: Shield,
    title: 'Administrators',
    desc: 'Full school-wide control — users, classes, subjects, timetables, and AI-powered insights.',
    img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80',
    color: 'from-emerald-500/20',
  },
]

const stats = [
  { value: '1,240+', label: 'Active Students' },
  { value: '64',     label: 'Teachers' },
  { value: '36',     label: 'Classes Running' },
  { value: '89',     label: 'Exams Conducted' },
]

export function LandingPage() {
  return (
    <div className="min-h-svh bg-[#080808] font-sans text-slate-100">

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg shadow-green-900/40">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
            </span>
            SkillUp
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-green-400">Features</a>
            <a href="#roles"    className="transition hover:text-green-400">Portals</a>
            <a href="#adaptive" className="transition hover:text-green-400">AI Powered</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
              Sign in
            </Link>
            <Link to="/login" className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-600">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/90 to-[#080808]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered School Management
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
              One platform for{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                SIS, LMS
              </span>{' '}
              &amp; smarter teaching
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-400">
              SkillUp unifies school operations and learning — with AI-generated exams, adaptive insights,
              and dashboards tailored for every role.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-green-900/40 transition hover:bg-green-600"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-xl border border-white/[0.10] bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.10]"
              >
                Explore features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/[0.06] px-4 sm:px-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-8 text-center">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-white">Built for real school workflows</h2>
          <p className="mt-2 text-slate-400">
            Modular tools for every role — from AI exam generation to class analytics, all in one dark, focused interface.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-white/[0.06] bg-[#111111] p-6 shadow-lg transition hover:border-green-500/30 hover:shadow-green-900/20"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-400 ring-1 ring-green-500/20 transition group-hover:bg-green-500/20">
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Roles with photos */}
      <section id="roles" className="bg-[#0a0a0a] py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">The right view for every role</h2>
            <p className="mx-auto mt-2 max-w-2xl text-slate-400">
              Each portal shows tailored navigation, KPIs, and actions — built for how each person actually works.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {roles.map((r) => (
              <div
                key={r.title}
                className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111] shadow-lg transition hover:border-green-500/20 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={r.img}
                    alt={r.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${r.color} to-[#111111] via-transparent`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 to-transparent" />
                </div>
                <div className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                    <r.icon className="h-5 w-5 text-green-400" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section id="adaptive" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/98 via-[#080808]/90 to-[#080808]/70" />
          <div className="relative px-10 py-16 sm:px-14">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                <Sparkles className="h-3.5 w-3.5" /> Powered by Gemini AI
              </span>
              <h2 className="mt-4 text-3xl font-bold text-white">Adaptive learning, visible in the UI</h2>
              <p className="mt-3 text-slate-400">
                Generate exams in seconds, surface at-risk alerts, and get AI class insights — all connected to Google Gemini.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><span className="text-green-400">→</span> AI exam generator — pick topic, Gemini writes the questions</li>
                <li className="flex items-center gap-2"><span className="text-green-400">→</span> Student AI coach — personalized chat for every learner</li>
                <li className="flex items-center gap-2"><span className="text-green-400">→</span> Class insights — topic heatmaps and at-risk detection</li>
              </ul>
              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-600"
              >
                Open SkillUp <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#080808] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-600 sm:flex-row sm:text-left sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-emerald-500">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2} />
            </span>
            <span className="text-slate-400">© {new Date().getFullYear()} SkillUp LMS</span>
          </div>
          <Link to="/login" className="font-medium text-green-500 hover:underline">
            Sign in to dashboard →
          </Link>
        </div>
      </footer>
    </div>
  )
}
