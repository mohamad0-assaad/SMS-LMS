import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'

type ClassRow = { _id: string; name: string }
type YearRow = { _id: string; name: string }
type ClassesRes = { classes: ClassRow[] }
type YearsRes = { years?: YearRow[] }

export function AdminTimetablePage() {
  const { role } = useParams()
  const base = `/app/${role ?? 'admin'}`
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [years, setYears] = useState<YearRow[]>([])
  const [classId, setClassId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('15:00')
  const [periods, setPeriods] = useState(7)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    Promise.all([
      getJson<ClassesRes>('/api/classes?page=1&limit=100'),
      getJson<YearsRes>('/api/academic-years?page=1&limit=100'),
    ])
      .then(([cl, y]) => {
        if (c) return
        const list = cl.classes ?? []
        setClasses(list)
        if (list[0]) setClassId((id) => id || list[0]!._id)
        const yList = y.years ?? []
        setYears(yList)
        if (yList[0]) setAcademicYearId((id) => id || yList[0]!._id)
      })
      .catch((e: Error) => {
        if (!c) setLoadErr(e.message)
      })
    return () => {
      c = true
    }
  }, [])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (!classId || !academicYearId) {
      setErr('Select a class and academic year.')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/timetables/generate', {
        method: 'POST',
        body: JSON.stringify({
          classId,
          academicYearId,
          settings: { startTime, endTime, periods },
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`)
      setMsg(data.message ?? 'Timetable generated successfully.')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20'
  const labelCls = 'block text-sm font-medium text-slate-300'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to={base} className="text-sm font-medium text-teal-400 hover:underline">
        ← Back to dashboard
      </Link>
      <div>
        <h1 className="text-lg font-semibold text-white">Generate timetable</h1>
        <p className="mt-1 text-sm text-slate-500">
          Triggers <code className="rounded bg-white/[0.06] px-1">POST /api/timetables/generate</code> (admin).
          The class needs subjects and matching teachers configured.
        </p>
      </div>
      {loadErr ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          {loadErr}
        </p>
      ) : null}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-lg"
      >
        {err ? (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            {err}
          </p>
        ) : null}
        {msg ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            {msg}
          </p>
        ) : null}
        <div>
          <label className={labelCls}>Class</label>
          <select
            required
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Select —</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Academic year</label>
          <select
            required
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Select —</option>
            {years.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Day start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Day end</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Periods per day</label>
          <input
            type="number"
            min={1}
            max={20}
            value={periods}
            onChange={(e) => setPeriods(Number(e.target.value) || 7)}
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !classes.length || !years.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? 'Generating… (this may take ~30 s)' : 'Generate timetable'}
        </button>
      </form>
    </div>
  )
}
