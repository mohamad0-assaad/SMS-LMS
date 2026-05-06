import { AlertTriangle, BookOpen, ClipboardList, School, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getJson } from '../lib/api'

type TeacherStats = {
  myClassesCount?: number
  totalStudentsInMyClasses?: number
  pendingGrading?: number
  nextClass?: string
}

type ClassRow = {
  _id: string
  name: string
  students?: string[]
  capacity?: number
  academicYear?: { name?: string } | string
  subjects?: string[]
}

type ExamRow = {
  _id: string
  title: string
  subject?: string | { _id?: string; name?: string }
  status?: string
  scheduledDate?: string
  submissionCount?: number
}

function subjectName(s: ExamRow['subject']): string {
  if (!s) return '—'
  if (typeof s === 'string') return s
  return s.name ?? '—'
}

function yearLabel(v: ClassRow['academicYear']): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  return v.name ?? ''
}

export function TeacherDashboard() {
  const { role } = useParams()
  const navigate = useNavigate()
  const base = `/app/${role ?? 'teacher'}`

  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [exams, setExams] = useState<ExamRow[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  useEffect(() => {
    let cancelled = false

    getJson<TeacherStats>('/api/dashboard/stats')
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => {})

    getJson<{ classes: ClassRow[] }>('/api/classes?page=1&limit=100')
      .then((d) => { if (!cancelled) { setClasses(d.classes ?? []); setLoadingClasses(false) } })
      .catch(() => { if (!cancelled) setLoadingClasses(false) })

    getJson<{ exams: ExamRow[] } | ExamRow[]>('/api/exams?limit=5')
      .then((d) => {
        if (cancelled) return
        const list = Array.isArray(d) ? d : (d as any).exams ?? []
        setExams(list.slice(0, 5))
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [])

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ minHeight: 140 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#0a0a0a] to-[#0d1a0d]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
        />
        <div className="absolute right-0 top-0 h-full w-2/5 bg-gradient-to-l from-green-600/20 to-transparent" />
        <div className="relative p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-400">
            Teacher Portal
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Manage your classes, track student progress, and generate AI-powered exams.
          </p>
          <button
            type="button"
            onClick={() => navigate(`${base}/ai/exam`)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-600"
          >
            <Sparkles className="h-4 w-4" /> Generate AI Exam
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-400">My Classes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <School className="h-4 w-4 text-green-400" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">
            {stats?.myClassesCount ?? (loadingClasses ? '—' : classes.length)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active assigned classes</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-400">My Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <Users className="h-4 w-4 text-green-400" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{stats?.totalStudentsInMyClasses ?? '—'}</p>
          <p className="mt-1 text-xs text-slate-500">Total enrolled students</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-400">Pending Grading</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{stats?.pendingGrading ?? '—'}</p>
          <p className="mt-1 text-xs font-medium text-amber-400">Submissions to review</p>
        </div>
      </div>

      {/* My Classes grid + Recent Exams */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* My Classes */}
        <section className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">My Classes</h2>
            <button
              type="button"
              onClick={() => navigate(`${base}/classes`)}
              className="text-xs font-medium text-green-400 hover:underline"
            >
              View all →
            </button>
          </div>

          {loadingClasses ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-white/[0.07] bg-[#111111] p-4 space-y-3">
                  <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
                  <div className="h-2 w-full rounded-full bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : !classes.length ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-center">
              <School className="h-8 w-8 text-green-800/50" />
              <p className="text-sm text-slate-500">No classes assigned yet.</p>
              <p className="text-xs text-slate-600">Contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => {
                const enrolled = cls.students?.length ?? 0
                const capacity = cls.capacity ?? 1
                const fillPct = Math.min(Math.round((enrolled / capacity) * 100), 100)
                const barColor = fillPct >= 90 ? 'bg-rose-500' : fillPct >= 70 ? 'bg-amber-400' : 'bg-green-500'
                return (
                  <div
                    key={cls._id}
                    className="rounded-xl border border-white/[0.07] bg-[#111111] p-4 transition-all hover:border-green-500/20 hover:shadow-md cursor-pointer"
                    onClick={() => navigate(`${base}/classes`)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{cls.name}</h3>
                        {yearLabel(cls.academicYear) && (
                          <span className="text-xs text-green-400">{yearLabel(cls.academicYear)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {enrolled}/{capacity}
                        </span>
                        {cls.subjects && cls.subjects.length > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-slate-600">{fillPct}% capacity</p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent Exams */}
        <section className="rounded-xl border border-white/[0.06] bg-[#111111] p-5 shadow-lg lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-green-400" />
              <h2 className="text-sm font-semibold text-white">Recent Exams</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(`${base}/exams`)}
              className="text-xs font-medium text-green-400 hover:underline"
            >
              All exams →
            </button>
          </div>

          {!exams.length ? (
            <p className="py-4 text-sm text-slate-500 text-center">No exams yet.</p>
          ) : (
            <ul className="space-y-2">
              {exams.map((ex) => (
                <li
                  key={ex._id}
                  onClick={() => navigate(`${base}/exams/${ex._id}`)}
                  className="cursor-pointer rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 transition hover:bg-white/[0.05]"
                >
                  <p className="text-sm font-medium text-white truncate">{ex.title}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 truncate">{subjectName(ex.subject)}</p>
                    {ex.status && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        ex.status === 'published' ? 'bg-green-500/20 text-green-400' :
                        ex.status === 'draft' ? 'bg-slate-500/20 text-slate-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ex.status}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => navigate(`${base}/exams`)}
            className="mt-2 w-full rounded-lg border border-white/[0.04] py-2 text-xs font-semibold text-slate-500 transition hover:bg-white/[0.03] hover:text-slate-300"
          >
            Manage all exams →
          </button>
        </section>
      </div>

      {/* AI Quick Access */}
      <div className="relative overflow-hidden rounded-xl border border-green-500/20 bg-[#0d1a0d] p-5 shadow-lg">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-600/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">AI Exam Generator</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-white">Draft an assessment in seconds</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Pick class, subject &amp; topic — Gemini generates questions instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${base}/ai/exam`)}
            className="shrink-0 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
          >
            Open AI Exam Generator
          </button>
        </div>
      </div>

      <p className="pb-2 text-center text-xs text-slate-600">
        Data updated today at {now}.
      </p>
    </div>
  )
}
