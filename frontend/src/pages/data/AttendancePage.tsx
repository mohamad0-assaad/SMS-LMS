import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, getJson, getProfile } from '../../lib/api'
import { CheckCircle2, XCircle, Clock, RefreshCw, Save } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role   = 'admin' | 'teacher' | 'student' | 'parent'
type Status = 'present' | 'absent' | 'late'

type Student    = { studentId: string; name: string; email: string; status: Status; remark: string }
type HistoryRow = { _id: string; studentName?: string; className: string; date: string; status: string; remark: string }
type Summary    = { total: number; present: number; absent: number; late: number; percentage: number; history: HistoryRow[] }
type Child      = { _id: string; name: string; studentClass?: { _id: string; name: string } | null }
type ClassOption = { _id: string; name: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusCls(s: string) {
  if (s === 'present') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (s === 'late')    return 'bg-amber-500/10  text-amber-400  border-amber-500/20'
  return                      'bg-rose-500/10   text-rose-400   border-rose-500/20'
}

function StatusBadge({ status }: { status: string }) {
  const Icon = status === 'present' ? CheckCircle2 : status === 'late' ? Clock : XCircle
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium capitalize ${statusCls(status)}`}>
      <Icon className="h-3 w-3" />{status}
    </span>
  )
}

// ─── Student view — auto-loads own attendance ─────────────────────────────────

function StudentView() {
  const [data, setData]       = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState<string | null>(null)

  function load() {
    setLoading(true); setErr(null)
    getJson<Summary>('/api/attendance/me')
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  if (loading) return <p className="text-sm text-slate-500 animate-pulse">Loading your attendance…</p>
  if (err) return <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>

  const d = data ?? { total: 0, present: 0, absent: 0, late: 0, percentage: 0, history: [] }
  const barColor = d.percentage >= 80 ? 'bg-emerald-500' : d.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
  const pctColor = d.percentage >= 80 ? 'text-emerald-400' : d.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">My Attendance</h2>
        <button onClick={load} className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          ['Total Days', d.total,   'text-slate-200'],
          ['Present',    d.present, 'text-emerald-400'],
          ['Absent',     d.absent,  'text-rose-400'],
          ['Late',       d.late,    'text-amber-400'],
        ] as [string, number, string][]).map(([label, val, cls]) => (
          <div key={label} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Rate bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-300">Attendance Rate</p>
          <p className={`text-sm font-bold ${pctColor}`}>{d.percentage}%</p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-white/[0.06]">
          <div className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${d.percentage}%` }} />
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <p className="text-sm font-semibold text-white">History</p>
        </div>
        {d.history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No records yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] text-left text-xs text-slate-500">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {d.history.map((r) => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-slate-300">{r.date}</td>
                  <td className="px-5 py-3 text-slate-400">{r.className}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-slate-500">{r.remark || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Parent view — auto-loads children, no class pickers ─────────────────────

function ParentView() {
  const [children, setChildren]     = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [data, setData]             = useState<Summary | null>(null)
  const [loadingList, setLoadingList]   = useState(true)
  const [loadingData, setLoadingData]   = useState(false)

  useEffect(() => {
    getJson<{ children: Child[] }>('/api/users/my-children')
      .then((d) => {
        const list = d.children ?? []
        setChildren(list)
        if (list[0]) setSelectedId(list[0]._id)
      })
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingData(true); setData(null)
    getJson<Summary>(`/api/attendance/child/${selectedId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoadingData(false))
  }, [selectedId])

  if (loadingList) return <p className="text-sm text-slate-500 animate-pulse">Loading children…</p>

  if (children.length === 0) return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111827] py-10 text-center space-y-1">
      <p className="text-sm font-medium text-slate-300">No children linked to your account</p>
      <p className="text-xs text-slate-500">Ask your administrator to link your children.</p>
    </div>
  )

  const selected = children.find((c) => c._id === selectedId)
  const d = data ?? { total: 0, present: 0, absent: 0, late: 0, percentage: 0, history: [] }
  const barColor = d.percentage >= 80 ? 'bg-emerald-500' : d.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
  const pctColor = d.percentage >= 80 ? 'text-emerald-400' : d.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div className="space-y-4">
      {/* Child tabs */}
      <div className="flex flex-wrap gap-2">
        {children.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedId(c._id)}
            className={[
              'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
              selectedId === c._id
                ? 'border-green-600/50 bg-green-700 text-white shadow-lg shadow-green-900/20'
                : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {c.name}
            {c.studentClass && <span className="ml-1.5 text-xs opacity-60">· {c.studentClass.name}</span>}
          </button>
        ))}
      </div>

      {/* Selected child card */}
      {selected && (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-sm font-bold text-white">
            {selected.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{selected.name}</p>
            {selected.studentClass && <p className="text-xs text-slate-500">{selected.studentClass.name}</p>}
          </div>
        </div>
      )}

      {loadingData ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading attendance…</p>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ['Total Days', d.total,   'text-slate-200'],
              ['Present',    d.present, 'text-emerald-400'],
              ['Absent',     d.absent,  'text-rose-400'],
              ['Late',       d.late,    'text-amber-400'],
            ] as [string, number, string][]).map(([label, val, cls]) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${cls}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Rate bar */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">Attendance Rate</p>
              <p className={`text-sm font-bold ${pctColor}`}>{d.percentage}%</p>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/[0.06]">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${d.percentage}%` }} />
            </div>
          </div>

          {/* History */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-3">
              <p className="text-sm font-semibold text-white">History</p>
            </div>
            {d.history.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No records yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05] text-left text-xs text-slate-500">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {d.history.map((r) => (
                    <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-slate-300">{r.date}</td>
                      <td className="px-5 py-3 text-slate-400">{r.className}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-slate-500">{r.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Teacher view ─────────────────────────────────────────────────────────────

function TeacherView({ userId }: { userId: string }) {
  const [classes, setClasses]     = useState<ClassOption[]>([])
  const [classId, setClassId]     = useState('')
  const [noClass, setNoClass]     = useState(false)
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents]   = useState<Student[]>([])
  const [history, setHistory]     = useState<HistoryRow[]>([])
  const [histStart, setHistStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10)
  })
  const [histEnd, setHistEnd]               = useState(new Date().toISOString().slice(0, 10))
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingHistory, setLoadingHistory]   = useState(false)
  // bump this after save → triggers the history useEffect reliably (no stale closure)
  const [histRefresh, setHistRefresh] = useState(0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState<string | null>(null)
  const [err, setErr]       = useState<string | null>(null)

  // Load teacher's classes — backend auto-filters by JWT (classTeacher = me)
  useEffect(() => {
    setLoadingClasses(true)
    getJson<{ classes: ClassOption[] }>('/api/classes?page=1&limit=50')
      .then((d) => {
        const list = d.classes ?? []
        setClasses(list)
        if (list[0]) setClassId(list[0]._id)
        else setNoClass(true)
      })
      .catch(() => setNoClass(true))
      .finally(() => setLoadingClasses(false))
  }, [userId])

  // Load students whenever class or date changes
  useEffect(() => {
    if (!classId) return
    setLoadingStudents(true)
    getJson<{ attendance: Student[] }>(`/api/attendance/class/${classId}?date=${date}`)
      .then((d) => setStudents(d.attendance ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false))
  }, [classId, date])

  // Load history whenever class, date range, OR histRefresh changes
  useEffect(() => {
    if (!classId) return
    setLoadingHistory(true)
    getJson<{ history: HistoryRow[] }>(
      `/api/attendance/class/${classId}/history?startDate=${histStart}&endDate=${histEnd}`
    )
      .then((d) => setHistory(d.history ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false))
  }, [classId, histStart, histEnd, histRefresh])

  function setStatus(studentId: string, status: Status) {
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, status } : s))
  }
  function setRemark(studentId: string, remark: string) {
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, remark } : s))
  }

  async function save() {
    if (!classId || !students.length) return
    setSaving(true); setErr(null); setMsg(null)
    try {
      const res = await apiFetch('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          classId, date,
          records: students.map((s) => ({ studentId: s.studentId, status: s.status, remark: s.remark })),
        }),
      })
      const d = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(d.message || 'Failed to save')
      setMsg('Attendance saved!')
      setHistRefresh((n) => n + 1)  // triggers history reload via useEffect
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingClasses) return <p className="text-sm text-slate-500 animate-pulse">Loading your classes…</p>

  if (noClass) return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-8 text-center space-y-1">
      <p className="text-sm font-semibold text-amber-400">No class assigned to you</p>
      <p className="text-xs text-amber-300/70">Ask an admin to assign you as a class teacher.</p>
    </div>
  )

  const presentCount = students.filter((s) => s.status === 'present').length
  const absentCount  = students.filter((s) => s.status === 'absent').length
  const lateCount    = students.filter((s) => s.status === 'late').length
  const selectedName = classes.find((c) => c._id === classId)?.name ?? ''

  const dateInputCls = 'rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50'

  return (
    <div className="space-y-6">

      {/* ── Controls row ── */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">

        {/* Class selector — shown only if teacher has multiple classes */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Class</label>
          {classes.length === 1 ? (
            <p className="text-sm font-semibold text-white py-2">{selectedName}</p>
          ) : (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className={dateInputCls}
            >
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Date — colorScheme:dark makes the native picker visible on dark bg */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className={`w-full ${dateInputCls}`}
          />
        </div>

        <button
          onClick={() => void save()}
          disabled={saving || !students.length}
          className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}

      {/* ── Students ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
          <p className="text-sm font-semibold text-white">
            Students <span className="ml-1.5 text-xs font-normal text-slate-500">{date}</span>
          </p>
          {students.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />{presentCount} present</span>
              <span className="inline-flex items-center gap-1 text-rose-400"><XCircle className="h-3.5 w-3.5" />{absentCount} absent</span>
              <span className="inline-flex items-center gap-1 text-amber-400"><Clock className="h-3.5 w-3.5" />{lateCount} late</span>
            </div>
          )}
        </div>

        {loadingStudents ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 animate-pulse">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No students in this class yet.</p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {students.map((s) => (
              <div key={s.studentId} className="flex flex-wrap items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                {/* Name */}
                <div className="flex items-center gap-3 min-w-[180px] flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-slate-300">
                    {s.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex gap-1.5">
                  {(['present', 'absent', 'late'] as Status[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatus(s.studentId, st)}
                      className={[
                        'rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                        s.status === st
                          ? statusCls(st)
                          : 'border-white/[0.06] text-slate-600 hover:text-slate-300 hover:border-white/[0.14]',
                      ].join(' ')}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Remark */}
                <input
                  value={s.remark}
                  onChange={(e) => setRemark(s.studentId, e.target.value)}
                  placeholder="Remark…"
                  className="w-36 rounded-lg border border-white/[0.06] bg-transparent px-2.5 py-1.5 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-green-500/40"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── History ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-white">Attendance History</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">From</label>
              <input type="date" value={histStart} onChange={(e) => setHistStart(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">To</label>
              <input type="date" value={histEnd} onChange={(e) => setHistEnd(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            </div>
            <button onClick={() => setHistRefresh((n) => n + 1)} disabled={loadingHistory}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04] disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              Reload
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            {loadingHistory ? 'Loading…' : 'No history for this date range.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] text-left text-xs text-slate-500">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-slate-300">{r.date}</td>
                  <td className="px-5 py-3 text-slate-300">{r.studentName ?? '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-slate-500">{r.remark || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Admin view — full edit across all classes ────────────────────────────────

function AdminView() {
  const [classes, setClasses]             = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate]                   = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents]           = useState<Student[]>([])
  const [history, setHistory]             = useState<HistoryRow[]>([])
  const [histStart, setHistStart]         = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10)
  })
  const [histEnd, setHistEnd]                 = useState(new Date().toISOString().slice(0, 10))
  const [loadingClasses, setLoadingClasses]   = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingHistory, setLoadingHistory]   = useState(false)
  const [histRefresh, setHistRefresh] = useState(0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState<string | null>(null)
  const [err, setErr]       = useState<string | null>(null)

  useEffect(() => {
    getJson<{ classes: ClassOption[] }>('/api/classes?page=1&limit=100')
      .then((d) => {
        const list = d.classes ?? []
        setClasses(list)
        if (list[0]) setSelectedClass(list[0]._id)
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false))
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    setLoadingStudents(true)
    getJson<{ attendance: Student[] }>(`/api/attendance/class/${selectedClass}?date=${date}`)
      .then((d) => setStudents(d.attendance ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false))
  }, [selectedClass, date])

  // Load history whenever class, date range, OR histRefresh changes
  useEffect(() => {
    if (!selectedClass) return
    setLoadingHistory(true)
    getJson<{ history: HistoryRow[] }>(
      `/api/attendance/class/${selectedClass}/history?startDate=${histStart}&endDate=${histEnd}`
    )
      .then((d) => setHistory(d.history ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false))
  }, [selectedClass, histStart, histEnd, histRefresh])

  function setStatus(studentId: string, status: Status) {
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, status } : s))
  }
  function setRemark(studentId: string, remark: string) {
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, remark } : s))
  }

  async function save() {
    if (!selectedClass || !students.length) return
    setSaving(true); setErr(null); setMsg(null)
    try {
      const res = await apiFetch('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass, date,
          records: students.map((s) => ({ studentId: s.studentId, status: s.status, remark: s.remark })),
        }),
      })
      const d = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(d.message || 'Failed to save')
      setMsg('Attendance saved!')
      setHistRefresh((n) => n + 1)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = students.filter((s) => s.status === 'present').length
  const absentCount  = students.filter((s) => s.status === 'absent').length
  const lateCount    = students.filter((s) => s.status === 'late').length

  return (
    <div className="space-y-6">

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Class</label>
          {loadingClasses ? (
            <div className="h-9 rounded-xl bg-white/[0.04] animate-pulse" />
          ) : (
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50">
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
        </div>
        <button
          onClick={() => void save()}
          disabled={saving || !students.length}
          className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}

      {/* Student rows */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
          <p className="text-sm font-semibold text-white">
            {classes.find((c) => c._id === selectedClass)?.name ?? 'Students'}
            <span className="ml-2 text-xs font-normal text-slate-500">{date}</span>
          </p>
          {students.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />{presentCount} present</span>
              <span className="inline-flex items-center gap-1 text-rose-400"><XCircle className="h-3.5 w-3.5" />{absentCount} absent</span>
              <span className="inline-flex items-center gap-1 text-amber-400"><Clock className="h-3.5 w-3.5" />{lateCount} late</span>
            </div>
          )}
        </div>

        {loadingStudents ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 animate-pulse">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No students in this class yet.</p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {students.map((s) => (
              <div key={s.studentId} className="flex flex-wrap items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-[180px] flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-slate-300">
                    {s.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['present', 'absent', 'late'] as Status[]).map((st) => (
                    <button key={st} onClick={() => setStatus(s.studentId, st)}
                      className={[
                        'rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                        s.status === st
                          ? statusCls(st)
                          : 'border-white/[0.06] text-slate-600 hover:text-slate-300 hover:border-white/[0.14]',
                      ].join(' ')}>
                      {st}
                    </button>
                  ))}
                </div>
                <input
                  value={s.remark}
                  onChange={(e) => setRemark(s.studentId, e.target.value)}
                  placeholder="Remark…"
                  className="w-36 rounded-lg border border-white/[0.06] bg-transparent px-2.5 py-1.5 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-green-500/40"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-white">Attendance History</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">From</label>
              <input type="date" value={histStart} onChange={(e) => setHistStart(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">To</label>
              <input type="date" value={histEnd} onChange={(e) => setHistEnd(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="rounded-xl border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            </div>
            <button onClick={() => setHistRefresh((n) => n + 1)} disabled={loadingHistory}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04] disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              Reload
            </button>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            {loadingHistory ? 'Loading…' : 'No history for this date range.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] text-left text-xs text-slate-500">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-slate-300">{r.date}</td>
                  <td className="px-5 py-3 text-slate-300">{r.studentName ?? '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-slate-500">{r.remark || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AttendancePage() {
  // Role comes straight from the URL (/app/:role/attendance) — always reliable
  const { role } = useParams<{ role: string }>()

  // Only teachers need their userId (to find their assigned class)
  const [userId, setUserId]     = useState('')
  const [loadingId, setLoadingId] = useState(role === 'teacher')

  useEffect(() => {
    if (role !== 'teacher') return
    getProfile()
      .then((p) => setUserId(p?._id ?? ''))
      .finally(() => setLoadingId(false))
  }, [role])

  const subtitle: Record<string, string> = {
    student: 'Your personal attendance record',
    parent:  "Your children's attendance records",
    teacher: 'Mark attendance for your class',
    admin:   'View and edit attendance across all classes',
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Attendance</h1>
        <p className="text-sm text-slate-500">{role ? (subtitle[role] ?? '') : ''}</p>
      </div>

      {role === 'student' && <StudentView />}
      {role === 'parent'  && <ParentView />}
      {role === 'teacher' && (
        loadingId
          ? <p className="text-sm text-slate-500 animate-pulse">Loading…</p>
          : <TeacherView userId={userId} />
      )}
      {role === 'admin' && <AdminView />}
    </div>
  )
}
