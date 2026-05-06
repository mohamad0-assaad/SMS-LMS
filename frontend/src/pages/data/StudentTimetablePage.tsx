import { useEffect, useMemo, useState } from 'react'
import { getJson, getProfile, type LoginUser } from '../../lib/api'

type Pop = { name?: string } | string

type Period = {
  startTime?: string
  endTime?: string
  subject?: Pop
  teacher?: Pop
}

type DaySchedule = { day: string; periods: Period[] }
type TimetableDoc = { schedule: DaySchedule[] }

function label(p: Pop | undefined): string {
  if (p == null) return '—'
  if (typeof p === 'string') return p
  return p.name ?? '—'
}

// Parse "HH:MM" into comparable minutes since midnight
function toMinutes(t: string | undefined): number {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function fmt(t: string | undefined): string {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  if (h == null) return t
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m ?? 0).padStart(2, '0')} ${ampm}`
}

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

// Subject color palette (cycles based on subject name hash)
const SUBJECT_COLORS = [
  { bg: 'bg-green-900/50', border: 'border-green-700/30', text: 'text-green-300' },
  { bg: 'bg-emerald-900/50', border: 'border-emerald-700/30', text: 'text-emerald-300' },
  { bg: 'bg-teal-900/40', border: 'border-teal-700/30', text: 'text-teal-300' },
  { bg: 'bg-lime-900/40', border: 'border-lime-700/30', text: 'text-lime-300' },
  { bg: 'bg-cyan-900/40', border: 'border-cyan-700/30', text: 'text-cyan-300' },
]

function subjectColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length]
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

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
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="grid grid-cols-6 border-b border-white/[0.04] last:border-b-0">
          <div className="border-r border-white/[0.06] p-3">
            <div className="h-3 w-12 rounded bg-white/[0.04] mx-auto" />
          </div>
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="border-r border-white/[0.04] p-2 last:border-r-0">
              {(i + j) % 3 === 0 && (
                <div className="h-12 rounded-lg bg-green-900/20 border border-green-700/20" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function StudentTimetablePage() {
  const [profile, setProfile] = useState<LoginUser | null>(null)
  const [tt, setTt] = useState<TimetableDoc | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    getProfile()
      .then((p) => { if (!c) setProfile(p) })
      .catch(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [])

  useEffect(() => {
    const classId = profile?.studentClass
    if (!classId) { setLoading(false); return }
    let c = false
    setLoading(true)
    setErr(null)
    getJson<TimetableDoc>(`/api/timetables/${classId}`)
      .then((d) => { if (!c) setTt(d) })
      .catch((e: Error) => { if (!c) { setErr(e.message); setTt(null) } })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [profile?.studentClass])

  const todayName = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    [],
  )

  // Days that actually have periods
  const orderedDays = useMemo(() => {
    const have = new Set((tt?.schedule ?? []).map((d) => d.day))
    return WEEK.filter((d) => have.has(d))
  }, [tt])

  // All unique time slots (sorted)
  const timeSlots = useMemo(() => {
    const slots = new Map<string, { start: string; end: string }>()
    for (const day of tt?.schedule ?? []) {
      for (const p of day.periods) {
        const key = `${p.startTime}-${p.endTime}`
        if (!slots.has(key)) {
          slots.set(key, { start: p.startTime ?? '', end: p.endTime ?? '' })
        }
      }
    }
    return [...slots.values()].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  }, [tt])

  // Build lookup: day → startTime → period
  const grid = useMemo(() => {
    const map = new Map<string, Map<string, Period>>()
    for (const day of tt?.schedule ?? []) {
      const dayMap = new Map<string, Period>()
      for (const p of day.periods) {
        dayMap.set(p.startTime ?? '', p)
      }
      map.set(day.day, dayMap)
    }
    return map
  }, [tt])

  // Initialize activeDay on mobile
  useEffect(() => {
    if (orderedDays.length > 0 && !activeDay) {
      setActiveDay(orderedDays.includes(todayName) ? todayName : orderedDays[0])
    }
  }, [orderedDays, todayName, activeDay])

  const noClass = !profile?.studentClass

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">My Timetable</h1>
        <p className="text-sm text-slate-500">
          {loading
            ? 'Loading schedule…'
            : noClass
              ? 'No class assigned to your profile yet.'
              : `Week schedule · Today is ${todayName}`}
        </p>
      </div>

      {/* No class warning */}
      {noClass && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-400">
          No class is assigned on your profile yet. Ask an admin to assign you to a class.
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-400">
          {err} — If no timetable exists for your class yet, ask an admin to create one.
        </div>
      )}

      {loading && <CalendarSkeleton />}

      {!loading && !err && tt?.schedule?.length ? (
        <>
          {/* ── Desktop grid ── */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] shadow-lg">
            {/* Day header row */}
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
                  <div
                    key={day}
                    className={[
                      'px-3 py-3 text-center border-r border-white/[0.06] last:border-r-0',
                      isToday ? 'bg-green-900/20' : '',
                    ].join(' ')}
                  >
                    <p className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-green-400' : 'text-slate-400'}`}>
                      {DAY_SHORT[day]}
                    </p>
                    {isToday && (
                      <span className="mt-0.5 inline-block h-1 w-1 rounded-full bg-green-400" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Time slot rows */}
            {timeSlots.map((slot, slotIdx) => (
              <div
                key={slot.start}
                className={[
                  'grid border-b border-white/[0.04] last:border-b-0',
                  slotIdx % 2 === 1 ? 'bg-white/[0.01]' : '',
                ].join(' ')}
                style={{ gridTemplateColumns: `80px repeat(${orderedDays.length}, 1fr)` }}
              >
                {/* Time label */}
                <div className="flex flex-col justify-center border-r border-white/[0.06] px-3 py-3">
                  <span className="text-[11px] font-semibold text-slate-400">{fmt(slot.start)}</span>
                  <span className="text-[10px] text-slate-600">{fmt(slot.end)}</span>
                </div>

                {/* Cells for each day */}
                {orderedDays.map((day) => {
                  const period = grid.get(day)?.get(slot.start)
                  const isToday = day === todayName
                  const sub = label(period?.subject)
                  const tea = label(period?.teacher)
                  const col = subjectColor(sub)

                  return (
                    <div
                      key={day}
                      className={[
                        'border-r border-white/[0.04] last:border-r-0 p-2',
                        isToday ? 'bg-green-900/[0.05]' : '',
                      ].join(' ')}
                    >
                      {period ? (
                        <div
                          className={`rounded-lg border px-2.5 py-2 ${col.bg} ${col.border} h-full`}
                        >
                          <p className={`text-xs font-semibold leading-tight ${col.text}`}>{sub}</p>
                          {tea !== '—' && (
                            <p className="mt-0.5 text-[10px] text-slate-500 truncate">{tea}</p>
                          )}
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

          {/* ── Mobile: day tabs + list ── */}
          <div className="md:hidden space-y-3">
            {/* Day tab strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {orderedDays.map((day) => {
                const isToday = day === todayName
                const isActive = activeDay === day
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDay(day)}
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
                    {isToday && !isActive && (
                      <span className="ml-1.5 inline-block h-1 w-1 rounded-full bg-green-400 align-middle" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Periods for selected day */}
            {activeDay && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
                {(() => {
                  const dayData = tt.schedule.find((d) => d.day === activeDay)
                  const periods = [...(dayData?.periods ?? [])].sort(
                    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
                  )
                  if (!periods.length) {
                    return (
                      <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                        No classes scheduled.
                      </div>
                    )
                  }
                  return periods.map((p, i) => {
                    const sub = label(p.subject)
                    const tea = label(p.teacher)
                    const col = subjectColor(sub)
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3 last:border-b-0"
                      >
                        <div className="w-20 shrink-0 text-center">
                          <p className="text-xs font-semibold text-slate-300">{fmt(p.startTime)}</p>
                          <p className="text-[10px] text-slate-600">{fmt(p.endTime)}</p>
                        </div>
                        <div className={`flex-1 rounded-xl border px-3 py-2.5 ${col.bg} ${col.border}`}>
                          <p className={`text-sm font-semibold ${col.text}`}>{sub}</p>
                          {tea !== '—' && (
                            <p className="mt-0.5 text-xs text-slate-500">{tea}</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>

          {/* Legend */}
          <p className="text-center text-[11px] text-slate-600">
            {timeSlots.length} period{timeSlots.length !== 1 ? 's' : ''} · {orderedDays.length} day{orderedDays.length !== 1 ? 's' : ''} per week
          </p>
        </>
      ) : !loading && !err && !noClass ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-center">
          <p className="text-slate-400">No timetable published for your class yet.</p>
          <p className="text-xs text-slate-600">Ask an admin to create a timetable for your class.</p>
        </div>
      ) : null}
    </div>
  )
}
