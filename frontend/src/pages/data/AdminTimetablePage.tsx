import { Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ClassRow = { _id: string; name: string }
type YearRow  = { _id: string; name: string }
type UserRow  = { _id: string; name: string; email?: string }

type ClassesRes = { classes: ClassRow[] }
type YearsRes   = { years?: YearRow[] }
type UsersRes   = { users?: UserRow[] }

type PeriodEntry = { startTime: string; endTime: string; subject: string; className: string }
type DaySchedule = { day: string; periods: PeriodEntry[] }
type ScheduleDoc = { schedule: DaySchedule[] }

// ─── Shared helpers ─────────────────────────────────────────────────────────────

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

const SUBJECT_COLORS = [
  { bg: 'bg-green-900/50',   border: 'border-green-700/30',   text: 'text-green-300',   sub: 'text-green-500'   },
  { bg: 'bg-emerald-900/50', border: 'border-emerald-700/30', text: 'text-emerald-300', sub: 'text-emerald-500' },
  { bg: 'bg-teal-900/40',    border: 'border-teal-700/30',    text: 'text-teal-300',    sub: 'text-teal-500'    },
  { bg: 'bg-lime-900/40',    border: 'border-lime-700/30',    text: 'text-lime-300',    sub: 'text-lime-500'    },
  { bg: 'bg-cyan-900/40',    border: 'border-cyan-700/30',    text: 'text-cyan-300',    sub: 'text-cyan-500'    },
]

function subjectColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length]
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function fmt(t: string | undefined) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m ?? 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// ─── Schedule skeleton ──────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="grid grid-cols-6 border-b border-white/[0.06]">
        <div className="border-r border-white/[0.06] p-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-r border-white/[0.06] p-3 last:border-r-0">
            <div className="h-4 w-10 rounded bg-white/[0.06] mx-auto" />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="grid grid-cols-6 border-b border-white/[0.04] last:border-b-0">
          <div className="border-r border-white/[0.06] p-3">
            <div className="h-3 w-12 rounded bg-white/[0.04] mx-auto" />
          </div>
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="border-r border-white/[0.04] p-2 last:border-r-0">
              {(i + j) % 3 === 0 && <div className="h-14 rounded-lg bg-green-900/20 border border-green-700/20" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Teacher schedule view ──────────────────────────────────────────────────────

function TeacherScheduleTab({ teachers }: { teachers: UserRow[] }) {
  const [teacherId, setTeacherId]   = useState(teachers[0]?._id ?? '')
  const [schedule, setSchedule]     = useState<DaySchedule[]>([])
  const [loading, setLoading]       = useState(false)
  const [err, setErr]               = useState<string | null>(null)
  const [activeDay, setActiveDay]   = useState<string | null>(null)

  const todayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), [])

  function load(id: string) {
    if (!id) return
    setLoading(true); setErr(null); setSchedule([]); setActiveDay(null)
    getJson<ScheduleDoc>(`/api/timetables/teacher-schedule?teacherId=${id}`, 30_000)
      .then((d) => setSchedule(d.schedule ?? []))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (teacherId) load(teacherId) }, [teacherId])

  const orderedDays = useMemo(() => {
    const have = new Set(schedule.map((d) => d.day))
    return WEEK.filter((d) => have.has(d))
  }, [schedule])

  const timeSlots = useMemo(() => {
    const slots = new Map<string, { start: string; end: string }>()
    for (const day of schedule) {
      for (const p of day.periods) {
        const key = `${p.startTime}-${p.endTime}`
        if (!slots.has(key)) slots.set(key, { start: p.startTime, end: p.endTime })
      }
    }
    return [...slots.values()].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  }, [schedule])

  const grid = useMemo(() => {
    const map = new Map<string, Map<string, PeriodEntry>>()
    for (const day of schedule) {
      const dayMap = new Map<string, PeriodEntry>()
      for (const p of day.periods) dayMap.set(p.startTime, p)
      map.set(day.day, dayMap)
    }
    return map
  }, [schedule])

  useEffect(() => {
    if (orderedDays.length > 0 && !activeDay) {
      setActiveDay(orderedDays.includes(todayName) ? todayName : orderedDays[0])
    }
  }, [orderedDays, todayName, activeDay])

  const selectedTeacher = teachers.find((t) => t._id === teacherId)
  const totalPeriods = schedule.reduce((s, d) => s + d.periods.length, 0)

  const selectCls = 'w-full rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50'

  return (
    <div className="space-y-5">
      {/* Teacher picker */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Teacher</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className={selectCls}
          >
            <option value="">— Select teacher —</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>{t.name}{t.email ? ` (${t.email})` : ''}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => load(teacherId)}
          disabled={!teacherId || loading}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Header info */}
      {selectedTeacher && (
        <p className="text-sm text-slate-500">
          {loading
            ? 'Loading schedule…'
            : err
              ? 'Could not load schedule'
              : `${selectedTeacher.name} · ${totalPeriods} period${totalPeriods !== 1 ? 's' : ''} this week`}
        </p>
      )}

      {err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-400">{err}</div>
      )}

      {loading && <CalendarSkeleton />}

      {!loading && !err && schedule.length > 0 ? (
        <>
          {/* Desktop grid */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] shadow-lg">
            <div
              className="grid border-b border-white/[0.08] bg-[#0d0d0d]"
              style={{ gridTemplateColumns: `80px repeat(${orderedDays.length}, 1fr)` }}
            >
              <div className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 border-r border-white/[0.06]">
                Time
              </div>
              {orderedDays.map((day) => {
                const isToday = day === todayName
                return (
                  <div key={day} className={`px-3 py-3 text-center border-r border-white/[0.06] last:border-r-0 ${isToday ? 'bg-green-900/20' : ''}`}>
                    <p className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-green-400' : 'text-slate-400'}`}>
                      {DAY_SHORT[day]}
                    </p>
                    {isToday && <span className="mt-0.5 inline-block h-1 w-1 rounded-full bg-green-400" />}
                  </div>
                )
              })}
            </div>

            {timeSlots.map((slot, idx) => (
              <div
                key={slot.start}
                className={`grid border-b border-white/[0.04] last:border-b-0 ${idx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                style={{ gridTemplateColumns: `80px repeat(${orderedDays.length}, 1fr)` }}
              >
                <div className="flex flex-col justify-center border-r border-white/[0.06] px-3 py-3">
                  <span className="text-[11px] font-semibold text-slate-400">{fmt(slot.start)}</span>
                  <span className="text-[10px] text-slate-600">{fmt(slot.end)}</span>
                </div>
                {orderedDays.map((day) => {
                  const period = grid.get(day)?.get(slot.start)
                  const isToday = day === todayName
                  const col = period ? subjectColor(period.subject) : null
                  return (
                    <div key={day} className={`border-r border-white/[0.04] last:border-r-0 p-2 ${isToday ? 'bg-green-900/[0.05]' : ''}`}>
                      {period && col ? (
                        <div className={`rounded-lg border px-2.5 py-2 ${col.bg} ${col.border} h-full`}>
                          <p className={`text-xs font-semibold leading-tight ${col.text}`}>{period.subject}</p>
                          <p className={`mt-0.5 text-[10px] ${col.sub} truncate`}>{period.className}</p>
                        </div>
                      ) : (
                        <div className="h-full min-h-[52px]" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden space-y-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {orderedDays.map((day) => {
                const isToday = day === todayName
                const isActive = activeDay === day
                return (
                  <button key={day} type="button" onClick={() => setActiveDay(day)}
                    className={[
                      'shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-green-700 text-white shadow-lg shadow-green-900/30'
                        : isToday
                          ? 'border border-green-700/30 bg-green-900/20 text-green-400'
                          : 'border border-white/[0.08] bg-[#111111] text-slate-400 hover:text-white',
                    ].join(' ')}
                  >
                    {DAY_SHORT[day]}
                    {isToday && !isActive && <span className="ml-1.5 inline-block h-1 w-1 rounded-full bg-green-400 align-middle" />}
                  </button>
                )
              })}
            </div>

            {activeDay && (() => {
              const dayData = schedule.find((d) => d.day === activeDay)
              const periods = [...(dayData?.periods ?? [])].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
              if (!periods.length) return (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#111111] text-sm text-slate-500">
                  No classes scheduled.
                </div>
              )
              return (
                <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
                  {periods.map((p, i) => {
                    const col = subjectColor(p.subject)
                    return (
                      <div key={i} className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3 last:border-b-0">
                        <div className="w-20 shrink-0 text-center">
                          <p className="text-xs font-semibold text-slate-300">{fmt(p.startTime)}</p>
                          <p className="text-[10px] text-slate-600">{fmt(p.endTime)}</p>
                        </div>
                        <div className={`flex-1 rounded-xl border px-3 py-2.5 ${col.bg} ${col.border}`}>
                          <p className={`text-sm font-semibold ${col.text}`}>{p.subject}</p>
                          <p className={`mt-0.5 text-xs ${col.sub}`}>{p.className}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          <p className="text-center text-[11px] text-slate-600">
            {timeSlots.length} slot{timeSlots.length !== 1 ? 's' : ''} · {orderedDays.length} day{orderedDays.length !== 1 ? 's' : ''} per week
          </p>
        </>
      ) : !loading && !err && teacherId ? (
        <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-center">
          <p className="text-slate-400">No schedule found for this teacher.</p>
          <p className="text-xs text-slate-600">Generate timetables on the Generate tab and assign this teacher to subjects first.</p>
        </div>
      ) : null}
    </div>
  )
}

// ─── Generate tab ───────────────────────────────────────────────────────────────

function GenerateTab({ classes, years }: { classes: ClassRow[]; years: YearRow[] }) {
  const [classId, setClassId]             = useState(classes[0]?._id ?? '')
  const [academicYearId, setAcademicYearId] = useState(years[0]?._id ?? '')
  const [startTime, setStartTime]         = useState('08:00')
  const [endTime, setEndTime]             = useState('15:00')
  const [periods, setPeriods]             = useState(7)
  const [submitting, setSubmitting]       = useState(false)
  const [msg, setMsg]                     = useState<string | null>(null)
  const [err, setErr]                     = useState<string | null>(null)

  // sync defaults when props arrive (async load)
  useEffect(() => { if (classes[0] && !classId) setClassId(classes[0]._id) }, [classes])
  useEffect(() => { if (years[0]  && !academicYearId) setAcademicYearId(years[0]._id) }, [years])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!classId || !academicYearId) { setErr('Select a class and academic year.'); return }
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/timetables/generate', {
        method: 'POST',
        body: JSON.stringify({ classId, academicYearId, settings: { startTime, endTime, periods } }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`)
      setMsg(`✓ ${data.message ?? 'Timetable generated successfully.'} Switch to "View Schedule" to see a teacher's timetable.`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20'
  const labelCls = 'block text-sm font-medium text-slate-300'

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-6 shadow-lg max-w-lg"
    >
      <p className="text-xs text-slate-500">
        The class needs subjects and matching teachers configured first.
      </p>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{msg}</p>}

      <div>
        <label className={labelCls}>Class</label>
        <select required value={classId} onChange={(e) => setClassId(e.target.value)}
          style={{ colorScheme: 'dark' }} className={inputCls}>
          <option value="">— Select —</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Academic Year</label>
        <select required value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}
          style={{ colorScheme: 'dark' }} className={inputCls}>
          <option value="">— Select —</option>
          {years.map((y) => <option key={y._id} value={y._id}>{y.name}</option>)}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Day Start</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            style={{ colorScheme: 'dark' }} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Day End</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
            style={{ colorScheme: 'dark' }} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Periods per Day</label>
        <input type="number" min={1} max={20} value={periods}
          onChange={(e) => setPeriods(Number(e.target.value) || 7)} className={inputCls} />
      </div>

      <button
        type="submit"
        disabled={submitting || !classes.length || !years.length}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Generating… (this may take ~30 s)' : 'Generate Timetable'}
      </button>
    </form>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────

export function AdminTimetablePage() {
  const { role } = useParams()
  const base = `/app/${role ?? 'admin'}`

  const [tab, setTab]         = useState<'generate' | 'view'>('generate')
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [years, setYears]     = useState<YearRow[]>([])
  const [teachers, setTeachers] = useState<UserRow[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    Promise.all([
      getJson<ClassesRes>('/api/classes?page=1&limit=100'),
      getJson<YearsRes>('/api/academic-years?page=1&limit=100'),
      getJson<UsersRes>('/api/users?role=teacher&page=1&limit=100'),
    ])
      .then(([cl, y, u]) => {
        if (c) return
        setClasses(cl.classes ?? [])
        setYears(y.years ?? [])
        setTeachers(u.users ?? [])
      })
      .catch((e: Error) => { if (!c) setLoadErr(e.message) })
    return () => { c = true }
  }, [])

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={[
        'rounded-xl px-4 py-2 text-sm font-medium transition-all',
        tab === id
          ? 'bg-green-700 text-white shadow-lg shadow-green-900/20'
          : 'border border-white/[0.08] text-slate-400 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to={base} className="text-sm font-medium text-green-400 hover:underline">
          ← Back
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-white">Timetable</h1>
        </div>
      </div>

      {loadErr && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          {loadErr}
        </p>
      )}

      {/* Tab strip */}
      <div className="flex gap-2">
        {tabBtn('generate', 'Generate Timetable')}
        {tabBtn('view', 'View Teacher Schedule')}
      </div>

      {tab === 'generate' && <GenerateTab classes={classes} years={years} />}
      {tab === 'view'     && <TeacherScheduleTab teachers={teachers} />}
    </div>
  )
}
