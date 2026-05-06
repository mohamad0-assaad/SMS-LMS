import { useEffect, useState } from 'react'
import { apiFetch, getJson, getProfile } from '../../lib/api'

type Student = { studentId: string; name: string; status: 'present' | 'absent' | 'late'; remark: string }
type ClassOption = { _id: string; name: string }

type MyRecord = { _id: string; className: string; date: string; status: string; remark: string }
type MyAttendance = {
  total: number
  present: number
  absent: number
  late: number
  percentage: number
  history: MyRecord[]
}

function statusBadge(status: string) {
  if (status === 'present') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'late') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

function cycleStatus(cur: 'present' | 'absent' | 'late'): 'present' | 'absent' | 'late' {
  if (cur === 'present') return 'absent'
  if (cur === 'absent') return 'late'
  return 'present'
}

// ─── Student view ─────────────────────────────────────────────────────────────

function StudentAttendanceView({ data }: { data: MyAttendance }) {
  const pct = data.percentage ?? 0
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-500'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">My Attendance</h1>
        <p className="text-sm text-slate-500">Your attendance record for this academic period.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          ['Total', data.total, 'text-slate-300'],
          ['Present', data.present, 'text-emerald-400'],
          ['Absent', data.absent, 'text-rose-400'],
          ['Late', data.late, 'text-amber-400'],
        ] as [string, number, string][]).map(([lbl, val, cls]) => (
          <div key={lbl} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{lbl}</p>
            <p className={`text-2xl font-bold ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Rate bar */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Attendance Rate</p>
          <span className={`text-lg font-bold ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-600">
          {pct >= 80
            ? 'Good standing — keep it up!'
            : pct >= 60
              ? 'Below recommended — try to attend more classes.'
              : 'At risk — please speak to your teacher.'}
        </p>
      </div>

      {/* History table */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">History</h2>
        </div>
        {data.history.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500 text-center px-6">
            No attendance records yet. Check back after your teacher marks attendance.
          </div>
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
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-slate-300 font-medium">{r.date}</td>
                  <td className="px-5 py-3 text-slate-400">{r.className}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
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

// ─── Teacher / Admin mark-attendance view ─────────────────────────────────────

function MarkAttendanceView() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState<Student[]>([])
  const [classLoading, setClassLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getJson<{ classes: ClassOption[] }>('/api/classes')
      .then((d) => {
        const list = d.classes ?? []
        setClasses(list)
        if (list[0]) setSelectedClass(list[0]._id)
      })
      .catch(() => {})
      .finally(() => setClassLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    setStudentsLoading(true)
    setErr(null)
    getJson<any>(`/api/attendance/class/${selectedClass}?date=${date}`)
      .then(async (d) => {
        const existing = d.attendance ?? []
        if (existing.length > 0) {
          setStudents(existing)
        } else {
          const cls = await getJson<{ students: { _id: string; name: string }[] }>(
            `/api/classes/${selectedClass}/students`,
          )
          setStudents(
            (cls.students ?? []).map((s) => ({
              studentId: s._id,
              name: s.name,
              status: 'present' as const,
              remark: '',
            })),
          )
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
  }, [selectedClass, date])

  function toggle(id: string) {
    setStudents((prev) =>
      prev.map((s) => s.studentId !== id ? s : { ...s, status: cycleStatus(s.status) }),
    )
  }

  async function save() {
    setSaving(true); setErr(null); setMsg(null)
    try {
      const res = await apiFetch('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass,
          date,
          records: students.map((s) => ({ studentId: s.studentId, status: s.status, remark: s.remark })),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || 'Failed')
      setMsg('Attendance saved successfully!')
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (classLoading) return <p className="text-sm text-slate-500">Loading classes…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Mark Attendance</h1>
        <p className="text-sm text-slate-500">Select a class and date, then mark each student.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
        >
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
        />
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}

      <div className="rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Status (click to cycle)</th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading ? (
              <tr><td colSpan={2} className="px-5 py-6 text-center text-sm text-slate-500">Loading students…</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={2} className="px-5 py-6 text-center text-sm text-slate-500">No students found in this class.</td></tr>
            ) : students.map((s) => (
              <tr key={s.studentId} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-slate-200 font-medium">{s.name}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggle(s.studentId)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold capitalize transition ${statusBadge(s.status)}`}
                  >
                    {s.status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {students.length > 0 && (
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Attendance'}
        </button>
      )}
    </div>
  )
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export function AttendancePage() {
  const [role, setRole] = useState<string | null>(null)
  const [myAttendance, setMyAttendance] = useState<MyAttendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchErr, setFetchErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((p) => {
        if (cancelled) return
        const r = p?.role ?? null
        setRole(r)
        if (r === 'student') {
          getJson<MyAttendance>('/api/attendance/me')
            .then((d) => { if (!cancelled) setMyAttendance(d) })
            .catch((e: Error) => { if (!cancelled) setFetchErr(e.message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        } else {
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="animate-pulse h-7 w-48 rounded-lg bg-white/[0.06]" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111] h-20" />
          ))}
        </div>
        <div className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111] h-16" />
      </div>
    )
  }

  if (role === 'student') {
    if (fetchErr) {
      return (
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-xl font-bold text-white">My Attendance</h1>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {fetchErr}
          </div>
        </div>
      )
    }
    return (
      <StudentAttendanceView
        data={myAttendance ?? { total: 0, present: 0, absent: 0, late: 0, percentage: 0, history: [] }}
      />
    )
  }

  return <MarkAttendanceView />
}
