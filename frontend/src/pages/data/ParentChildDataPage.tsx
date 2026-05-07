import { useEffect, useMemo, useState } from 'react'
import { getJson } from '../../lib/api'
import { BookOpen, CalendarDays, ClipboardList, GraduationCap, Users } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Child = {
  _id: string
  name: string
  email: string
  studentClass?: { _id: string; name: string } | null
}

type AttendanceRecord = { _id: string; className: string; date: string; status: string; remark: string }
type AttendanceData = { total: number; present: number; absent: number; late: number; percentage: number; history: AttendanceRecord[] }

type ExamResult = { _id: string; examTitle: string; subject?: string; score: number; maxScore: number; percentage: number; submittedAt: string }

type Period = { startTime?: string; endTime?: string; subject?: { name?: string } | string; teacher?: { name?: string } | string }
type DaySchedule = { day: string; periods: Period[] }
type Timetable = { schedule: DaySchedule[] }

type Tab = 'attendance' | 'results' | 'timetable'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === 'present') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'late') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

function label(p: { name?: string } | string | undefined): string {
  if (!p) return '—'
  if (typeof p === 'string') return p
  return p.name ?? '—'
}

function fmt(t: string | undefined): string {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  if (h == null) return t
  return `${h % 12 || 12}:${String(m ?? 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function scoreBadge(pct: number) {
  if (pct >= 70) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

// ─── Attendance tab ───────────────────────────────────────────────────────────

function AttendanceTab({ childId }: { childId: string }) {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    setLoading(true); setErr(null); setData(null)
    getJson<AttendanceData>(`/api/attendance/child/${childId}`)
      .then((d) => { if (!c) setData(d) })
      .catch((e: Error) => { if (!c) setErr(e.message) })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [childId])

  if (loading) return <p className="text-sm text-slate-500 py-6 text-center">Loading attendance…</p>
  if (err) return <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>
  if (!data) return null

  const pct = data.percentage
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-500'

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          ['Total', data.total, 'text-slate-300'],
          ['Present', data.present, 'text-emerald-400'],
          ['Absent', data.absent, 'text-rose-400'],
          ['Late', data.late, 'text-amber-400'],
        ] as [string, number, string][]).map(([l, v, cls]) => (
          <div key={l} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{l}</p>
            <p className={`text-2xl font-bold ${cls}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Rate bar */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Attendance Rate</p>
          <span className={`text-lg font-bold ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-600">
          {pct >= 80 ? 'Good standing.' : pct >= 60 ? 'Below recommended — encourage more attendance.' : 'At risk — please contact the school.'}
        </p>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <h3 className="text-sm font-semibold text-white">History</h3>
        </div>
        {data.history.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">No records yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 hidden sm:table-cell">Remark</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((r) => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-300 font-medium">{r.date}</td>
                  <td className="px-5 py-3 text-slate-400">{r.className}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell text-slate-500 text-xs">{r.remark || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Results tab ──────────────────────────────────────────────────────────────

function ResultsTab({ childId }: { childId: string }) {
  const [rows, setRows] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    setLoading(true); setErr(null)
    getJson<ExamResult[]>(`/api/exams/child/${childId}/results`)
      .then((d) => { if (!c) setRows(d) })
      .catch((e: Error) => { if (!c) setErr(e.message) })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [childId])

  if (loading) return <p className="text-sm text-slate-500 py-6 text-center">Loading results…</p>
  if (err) return <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>

  if (rows.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-slate-500">
        <BookOpen className="h-8 w-8 opacity-30" />
        <p className="text-sm">No exam results yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            <th className="px-5 py-3">Exam</th>
            <th className="px-5 py-3 hidden sm:table-cell">Subject</th>
            <th className="px-5 py-3">Score</th>
            <th className="px-5 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              <td className="px-5 py-3 text-slate-200 font-medium">{r.examTitle}</td>
              <td className="px-5 py-3 hidden sm:table-cell text-slate-400">{r.subject || '—'}</td>
              <td className="px-5 py-3">
                <span className={`font-bold ${scoreBadge(r.percentage)}`}>{r.percentage}%</span>
                <span className="ml-1.5 text-xs text-slate-600">{r.score}/{r.maxScore}</span>
              </td>
              <td className="px-5 py-3 text-slate-500 text-xs">
                {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Timetable tab ────────────────────────────────────────────────────────────

function TimetableTab({ classId, className }: { classId: string; className: string }) {
  const [tt, setTt] = useState<Timetable | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    setLoading(true); setErr(null)
    getJson<Timetable>(`/api/timetables/${classId}`)
      .then((d) => { if (!c) setTt(d) })
      .catch((e: Error) => { if (!c) setErr(e.message) })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [classId])

  if (loading) return <p className="text-sm text-slate-500 py-6 text-center">Loading timetable…</p>
  if (err) return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
      No timetable published for {className} yet.
    </div>
  )

  const orderedDays = useMemo(() => {
    const have = new Set((tt?.schedule ?? []).map((d) => d.day))
    return WEEK.filter((d) => have.has(d))
  }, [tt])

  if (!tt?.schedule?.length || orderedDays.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/[0.08] text-sm text-slate-500">
        No timetable published for {className} yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orderedDays.map((day) => {
        const dayData = tt.schedule.find((d) => d.day === day)
        const periods = [...(dayData?.periods ?? [])].sort((a, b) => {
          const toMin = (t?: string) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return (h||0)*60+(m||0) }
          return toMin(a.startTime) - toMin(b.startTime)
        })
        if (!periods.length) return null
        return (
          <div key={day} className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{day}</p>
            </div>
            {periods.map((p, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] px-5 py-3 last:border-b-0">
                <div className="w-28 shrink-0">
                  <p className="text-xs font-semibold text-slate-300">{fmt(p.startTime)}</p>
                  <p className="text-[10px] text-slate-600">{fmt(p.endTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label(p.subject)}</p>
                  {label(p.teacher) !== '—' && <p className="text-xs text-slate-500">{label(p.teacher)}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ParentChildDataPage({ defaultTab = 'attendance' }: { defaultTab?: Tab }) {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getJson<{ children: Child[] }>('/api/users/my-children')
      .then((d) => {
        const list = d.children ?? []
        setChildren(list)
        if (list[0]) setSelectedId(list[0]._id)
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setTab(defaultTab)
  }, [defaultTab])

  const child = children.find((c) => c._id === selectedId) ?? null

  const TABS: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
    { key: 'attendance', label: 'Attendance', icon: CalendarDays },
    { key: 'results', label: 'Exam Results', icon: ClipboardList },
    { key: 'timetable', label: 'Timetable', icon: BookOpen },
  ]

  if (loading) return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="animate-pulse h-7 w-48 rounded-lg bg-white/[0.06]" />
      <div className="animate-pulse h-12 rounded-2xl bg-white/[0.04]" />
    </div>
  )

  if (err) return (
    <div className="mx-auto max-w-4xl">
      <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>
    </div>
  )

  if (children.length === 0) return (
    <div className="mx-auto max-w-4xl flex flex-col items-center gap-3 py-20 text-slate-500">
      <Users className="h-12 w-12 opacity-20" />
      <p className="text-base font-semibold text-slate-300">No children linked</p>
      <p className="text-sm">Ask your school admin to link your children to your account.</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            {TABS.find((t) => t.key === tab)?.label ?? 'Overview'}
          </h1>
          <p className="text-sm text-slate-500">Viewing data for your children.</p>
        </div>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setSelectedId(c._id)}
              className={[
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                selectedId === c._id
                  ? 'border-green-700/40 bg-green-900/20 text-green-300'
                  : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white',
              ].join(' ')}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-800 text-xs font-bold text-white">
                {c.name.slice(0, 1).toUpperCase()}
              </span>
              {c.name}
              {c.studentClass && (
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-500">
                  {c.studentClass.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Single child info bar */}
      {child && (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#111111] px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">
            {child.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{child.name}</p>
            <p className="text-xs text-slate-500">
              {child.studentClass ? child.studentClass.name : 'No class assigned'} · {child.email}
            </p>
          </div>
          <GraduationCap className="ml-auto h-5 w-5 text-green-600 opacity-50" />
        </div>
      )}

      {/* Tab strip */}
      <div className="flex gap-1.5 border-b border-white/[0.06] pb-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'flex items-center gap-1.5 rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-medium transition-all',
              tab === key
                ? 'border-green-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {child && tab === 'attendance' && <AttendanceTab childId={child._id} />}
      {child && tab === 'results' && <ResultsTab childId={child._id} />}
      {child && tab === 'timetable' && (
        child.studentClass
          ? <TimetableTab classId={child.studentClass._id} className={child.studentClass.name} />
          : <p className="text-sm text-slate-500 py-6 text-center">No class assigned — ask an admin to assign {child.name} to a class.</p>
      )}
    </div>
  )
}
