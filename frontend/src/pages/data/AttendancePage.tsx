import { useEffect, useState } from 'react'
import { apiFetch, getJson, getProfile } from '../../lib/api'

type Student = { studentId: string; name: string; status: 'present' | 'absent' | 'late'; remark: string }
type AttendanceRecord = { _id: string; className: string; date: string; status: string; remark: string }
type ClassOption = { _id: string; name: string }

function badge(status: string) {
  if (status === 'present') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'late') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

export function AttendancePage() {
  const [role, setRole] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState<Student[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [childAttendance, setChildAttendance] = useState<{ total: number; present: number; absent: number; late: number; percentage: number; history: AttendanceRecord[] } | null>(null)
  const [myRecords, setMyRecords] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((p) => {
      setRole(p?.role ?? null)
      if (p?.role === 'student') {
        getJson<any>('/api/attendance/me').then(setMyRecords).catch(() => {}).finally(() => setLoading(false))
      } else if (p?.role === 'parent') {
        getJson<any>('/api/users/my-children')
          .then((d) => {
            const linkedChildren = d.children ?? []
            setChildren(linkedChildren)
            if (linkedChildren?.[0]) setSelectedChildId(linkedChildren[0]._id)
          })
          .catch(() => {})
          .finally(() => setLoading(false))
      } else {
        getJson<{ classes: ClassOption[] }>('/api/classes').then((d) => {
          setClasses(d.classes ?? [])
          if (d.classes?.[0]) setSelectedClass(d.classes[0]._id)
        }).finally(() => setLoading(false))
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedClass || (role !== 'teacher' && role !== 'admin')) return
    setLoading(true)
    getJson<any>(`/api/attendance/class/${selectedClass}?date=${date}`)
      .then((d) => setStudents(d.attendance ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [selectedClass, date, role])

  useEffect(() => {
    if (role !== 'parent' || !selectedChildId) return
    setLoading(true)
    getJson<any>(`/api/attendance/child/${selectedChildId}`)
      .then((d) => setChildAttendance(d))
      .catch(() => setChildAttendance(null))
      .finally(() => setLoading(false))
  }, [role, selectedChildId])

  function toggle(studentId: string) {
    setStudents((prev) => prev.map((s) => {
      if (s.studentId !== studentId) return s
      const next = s.status === 'present' ? 'absent' : s.status === 'absent' ? 'late' : 'present'
      return { ...s, status: next }
    }))
  }

  async function save() {
    setSaving(true); setErr(null); setMsg(null)
    try {
      const res = await apiFetch('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ classId: selectedClass, date, records: students.map((s) => ({ studentId: s.studentId, status: s.status, remark: s.remark })) }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || 'Failed')
      setMsg('Attendance saved!')
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>

  if (role === 'student' && myRecords) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-lg font-semibold text-white">My Attendance</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['Total', myRecords.total, 'text-slate-300'], ['Present', myRecords.present, 'text-emerald-400'], ['Absent', myRecords.absent, 'text-rose-400'], ['Late', myRecords.late, 'text-amber-400']].map(([label, val, cls]) => (
            <div key={label as string} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${cls}`}>{val}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
          <p className="mb-1 text-sm font-medium text-white">Attendance rate</p>
          <div className="mt-2 h-2.5 w-full rounded-full bg-white/[0.06]">
            <div className="h-2.5 rounded-full bg-teal-500" style={{ width: `${myRecords.percentage}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-teal-400">{myRecords.percentage}%</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-left text-xs text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody>
              {(myRecords.history ?? []).map((r: any) => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-300">{r.date}</td>
                  <td className="px-4 py-3 text-slate-400">{r.className}</td>
                  <td className="px-4 py-3"><span className={`rounded-lg border px-2 py-0.5 text-xs font-medium capitalize ${badge(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (role === 'parent') {
    const attendance = childAttendance

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-lg font-semibold text-white">Children Attendance</h1>
        {children.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 text-slate-400">
            No linked children found. Ask your administrator to link your children to your account.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <span>Child:</span>
                <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#111827] px-3 py-2 text-sm text-white">
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {(c.studentClass?.name) ? `(${c.studentClass.name})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!attendance ? (
              <p className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 text-slate-400">
                No attendance records available for this child yet.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[['Total', attendance.total, 'text-slate-300'], ['Present', attendance.present, 'text-emerald-400'], ['Absent', attendance.absent, 'text-rose-400'], ['Late', attendance.late, 'text-amber-400']].map(([label, val, cls]) => (
                    <div key={label as string} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className={`mt-1 text-2xl font-bold ${cls}`}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
                  <p className="mb-1 text-sm font-medium text-white">Attendance rate</p>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-white/[0.06]">
                    <div className="h-2.5 rounded-full bg-teal-500" style={{ width: `${attendance.percentage}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-teal-400">{attendance.percentage}%</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.06] text-left text-xs text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Remark</th></tr></thead>
                    <tbody>
                      {(attendance.history ?? []).map((r: AttendanceRecord) => (
                        <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-slate-300">{r.date}</td>
                          <td className="px-4 py-3 text-slate-400">{r.className}</td>
                          <td className="px-4 py-3"><span className={`rounded-lg border px-2 py-0.5 text-xs font-medium capitalize ${badge(r.status)}`}>{r.status}</span></td>
                          <td className="px-4 py-3 text-slate-400">{r.remark || '—'}</td>
                        </tr>
                      ))}
                      {!attendance.history?.length && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No attendance records found for this child.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-white">Mark Attendance</h1>
      <div className="flex flex-wrap gap-3">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-[#111827] px-3 py-2 text-sm text-white">
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-[#111827] px-3 py-2 text-sm text-white" />
      </div>
      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06] text-left text-xs text-slate-500"><th className="px-4 py-3">Student</th><th className="px-4 py-3">Status (click to cycle)</th></tr></thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.studentId} className="border-b border-white/[0.04]">
                <td className="px-4 py-3 text-slate-200">{s.name}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(s.studentId)} className={`rounded-lg border px-3 py-1 text-xs font-medium capitalize transition ${badge(s.status)}`}>{s.status}</button>
                </td>
              </tr>
            ))}
            {!students.length && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">No students found</td></tr>}
          </tbody>
        </table>
      </div>
      {students.length > 0 && (
        <button onClick={save} disabled={saving}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Attendance'}
        </button>
      )}
    </div>
  )
}
