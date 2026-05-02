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

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function StudentTimetablePage() {
  const [profile, setProfile] = useState<LoginUser | null>(null)
  const [tt, setTt] = useState<TimetableDoc | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    getProfile()
      .then((p) => { if (!c) setProfile(p) })
      .catch(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [])

  useEffect(() => {
    const classId = profile?.studentClass
    if (!classId) {
      setLoading(false)
      setTt(null)
      return
    }
    let c = false
    setLoading(true)
    setErr(null)
    getJson<TimetableDoc>(`/api/timetables/${classId}`)
      .then((d) => {
        if (!c) setTt(d)
      })
      .catch((e: Error) => {
        if (!c) {
          setErr(e.message)
          setTt(null)
        }
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => {
      c = true
    }
  }, [profile?.studentClass])

  const todayName = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    [],
  )

  const todayPeriods = useMemo(() => {
    const day = tt?.schedule?.find((d) => d.day === todayName)
    return day?.periods ?? []
  }, [tt, todayName])

  const orderedDays = useMemo(() => {
    const have = new Set((tt?.schedule ?? []).map((d) => d.day))
    return WEEK.filter((d) => have.has(d))
  }, [tt])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">My timetable</h1>
        <p className="text-sm text-slate-500">
          Today is <strong className="text-slate-300">{todayName}</strong>
          {profile?.studentClass ? '' : ' — link your account to a class to load a live schedule.'}
        </p>
      </div>

      {!profile?.studentClass ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          No class is assigned on your profile yet. Ask an admin to set <code className="rounded bg-white/[0.06] px-1">studentClass</code> for
          your user.
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
          <p className="mt-2 text-xs text-rose-400/70">
            If no timetable exists for your class yet, an admin can generate one from the Timetable
            tools.
          </p>
        </div>
      ) : !tt?.schedule?.length ? (
        <p className="text-sm text-slate-500">No periods published for your class yet.</p>
      ) : (
        <>
          <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-lg">
            <h2 className="text-base font-semibold text-white">Today</h2>
            {!todayPeriods.length ? (
              <p className="mt-2 text-sm text-slate-500">No classes scheduled for today.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {todayPeriods.map((p, i) => (
                  <li
                    key={`${p.startTime}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{label(p.subject)}</p>
                      <p className="text-xs text-slate-500">
                        {p.startTime ?? '—'} – {p.endTime ?? '—'}
                      </p>
                    </div>
                    <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-slate-400 ring-1 ring-white/[0.08]">
                      {label(p.teacher)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-lg">
            <h2 className="text-base font-semibold text-white">Full week</h2>
            <div className="mt-4 space-y-6">
              {orderedDays.map((day) => {
                const block = tt.schedule.find((d) => d.day === day)
                if (!block?.periods.length) return null
                return (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-violet-400">{day}</h3>
                    <ul className="mt-2 space-y-2">
                      {block.periods.map((p, i) => (
                        <li
                          key={`${day}-${i}`}
                          className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-200">{label(p.subject)}</span>
                          <span className="text-slate-500">
                            {p.startTime} – {p.endTime}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
