import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'
import { BookOpen, GraduationCap, Mail, Pencil, School, Users, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Populated = { _id?: string; name?: string; email?: string } | string

type ClassRow = {
  _id: string
  name: string
  capacity?: number
  subjects?: string[]
  students?: string[]
  academicYear?: Populated
  classTeacher?: Populated
}

type ClassesResponse = {
  classes: ClassRow[]
  pagination: { total: number; page: number; pages: number }
}

type StudentRow = {
  _id: string
  name: string
  email: string
  isActive?: boolean
}

type TeacherRow = { _id: string; name: string; email?: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function label(v: Populated | undefined): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  return v.name ?? v.email ?? '—'
}

function teacherId(v: Populated | undefined): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  return v._id ?? ''
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-4">
      <div className="h-5 w-1/2 rounded-lg bg-white/[0.06]" />
      <div className="h-3 w-1/3 rounded-full bg-white/[0.06]" />
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-white/[0.06]" />
        <div className="h-3 w-2/5 rounded bg-white/[0.06]" />
      </div>
      <div className="space-y-1.5 pt-1 border-t border-white/[0.05]">
        <div className="flex justify-between">
          <div className="h-3 w-1/4 rounded bg-white/[0.06]" />
          <div className="h-3 w-1/6 rounded bg-white/[0.06]" />
        </div>
        <div className="h-2 w-full rounded-full bg-white/[0.06]" />
      </div>
    </div>
  )
}

// ─── Roster Drawer ────────────────────────────────────────────────────────────

function RosterDrawer({ cls, onClose }: { cls: ClassRow | null; onClose: () => void }) {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const isOpen = cls !== null

  useEffect(() => {
    if (!cls) return
    setStudents([]); setErr(null); setLoading(true)
    const enrolledIds = new Set((cls.students ?? []).map(String))
    getJson<{ users: StudentRow[] }>('/api/users?role=student&limit=500')
      .then((d) => {
        const inClass = (d.users ?? []).filter((u) => enrolledIds.has(String(u._id)))
        setStudents(inClass)
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [cls?._id])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <div className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0f0f0f] shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-start justify-between border-b border-white/[0.07] p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-green-400" />
              <h2 className="text-base font-bold text-white">{cls?.name} — Student Roster</h2>
            </div>
            <p className="text-sm text-slate-500">
              {loading ? 'Loading…' : `${students.length} student${students.length !== 1 ? 's' : ''} enrolled`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/[0.08] p-1.5 text-slate-500 transition-colors hover:border-green-500/30 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-px px-6 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 border-b border-white/[0.05] py-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                    <div className="h-2.5 w-2/3 rounded bg-white/[0.06]" />
                  </div>
                  <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : err ? (
            <div className="m-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
          ) : students.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] mx-6 mt-6 text-center">
              <Users className="h-8 w-8 text-green-800/60" />
              <p className="text-sm text-slate-500">No students enrolled yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-white/[0.07] bg-[#0d0d0d] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                <span>#</span><span>Student</span><span>Status</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {students.map((s, i) => (
                  <div key={s._id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 px-6 py-3 transition-colors hover:bg-white/[0.02]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-900/40 text-xs font-bold text-green-400">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{s.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                        <Mail className="h-3 w-3 shrink-0" />{s.email}
                      </p>
                    </div>
                    {s.isActive === false ? (
                      <span className="rounded-full border border-amber-700/20 bg-amber-900/30 px-2.5 py-0.5 text-xs text-amber-400">Inactive</span>
                    ) : (
                      <span className="rounded-full border border-green-700/20 bg-green-900/30 px-2.5 py-0.5 text-xs text-green-400">Active</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Manage Class Modal ───────────────────────────────────────────────────────

function ManageClassModal({
  cls,
  onClose,
  onSaved,
}: {
  cls: ClassRow
  onClose: () => void
  onSaved: () => void
}) {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [allStudents, setAllStudents] = useState<StudentRow[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState(teacherId(cls.classTeacher))
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set((cls.students ?? []).map(String))
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      getJson<{ users: TeacherRow[] }>('/api/users?role=teacher&limit=200'),
      getJson<{ users: StudentRow[] }>('/api/users?role=student&limit=500'),
    ]).then(([td, sd]) => {
      setTeachers(td.users ?? [])
      setAllStudents(sd.users ?? [])
    }).catch(() => {})

    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true); setErr(null)
    try {
      // Update class teacher if changed
      const currentTeacherId = teacherId(cls.classTeacher)
      if (selectedTeacher !== currentTeacherId) {
        const res = await apiFetch(`/api/classes/update/${cls._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ classTeacher: selectedTeacher || null }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.message || 'Failed to update teacher')
        }
      }
      // Update students
      const res2 = await apiFetch(`/api/classes/${cls._id}/students`, {
        method: 'PUT',
        body: JSON.stringify({ studentIds: [...selectedStudents] }),
      })
      if (!res2.ok) {
        const d = await res2.json().catch(() => ({}))
        throw new Error(d.message || 'Failed to update students')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl border border-green-500/20 bg-[#111111] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Manage Class</h2>
            <p className="text-xs text-slate-500 mt-0.5">{cls.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {err && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
          )}

          {/* Class Teacher */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Class Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-green-500/50"
            >
              <option value="">— No teacher assigned —</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Students */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-300">
                Students <span className="text-green-400">({selectedStudents.size} selected)</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-green-500/50"
            />
            <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.07] bg-[#0a0a0a] divide-y divide-white/[0.04]">
              {filteredStudents.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">No students found.</p>
              ) : filteredStudents.map((s) => (
                <label key={s._id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(s._id)}
                    onChange={() => toggleStudent(s._id)}
                    className="h-4 w-4 rounded accent-green-500 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.email}</p>
                  </div>
                  {selectedStudents.has(s._id) && (
                    <span className="shrink-0 rounded-full border border-green-700/20 bg-green-900/30 px-2 py-0.5 text-[10px] text-green-400">Enrolled</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/[0.07] px-6 py-4 shrink-0">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ClassesListPage() {
  const { role } = useParams()
  const base = role ? `/app/${role}` : ''
  const isAdmin = role === 'admin'
  const [data, setData] = useState<ClassesResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rosterClass, setRosterClass] = useState<ClassRow | null>(null)
  const [managingClass, setManagingClass] = useState<ClassRow | null>(null)

  function load() {
    setLoading(true)
    setErr(null)
    getJson<ClassesResponse>('/api/classes?page=1&limit=100')
      .then((d) => setData(d))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {managingClass && (
        <ManageClassModal
          cls={managingClass}
          onClose={() => setManagingClass(null)}
          onSaved={() => { setManagingClass(null); load() }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Classes</h1>
          <p className="text-sm text-slate-500">
            {role === 'teacher'
              ? 'Your assigned classes.'
              : 'Manage grades, sections, teacher assignments and student enrollment.'}
          </p>
        </div>
        {isAdmin && (
          <Link
            to={`${base}/classes/new`}
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600"
          >
            + Create class
          </Link>
        )}
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      )}

      {/* Empty state for teacher */}
      {!loading && role === 'teacher' && !data?.classes.length && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-center">
          <School className="h-10 w-10 text-green-800/50" />
          <p className="text-slate-400">No classes assigned to you yet.</p>
          <p className="text-xs text-slate-600">Contact your administrator to be assigned as a class teacher.</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.classes.length && role !== 'teacher' ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-center">
          <School className="h-10 w-10 text-green-800/50" />
          <p className="text-slate-400">No classes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.classes ?? []).map((cls) => {
            const enrolled = cls.students?.length ?? 0
            const capacity = cls.capacity ?? 1
            const fillPct = Math.min(Math.round((enrolled / capacity) * 100), 100)
            const barColor = fillPct >= 90 ? 'bg-rose-500' : fillPct >= 70 ? 'bg-amber-400' : 'bg-green-500'

            return (
              <div
                key={cls._id}
                className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-4 transition-shadow hover:shadow-lg hover:shadow-black/40"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold leading-tight text-white">{cls.name}</h3>
                    {cls.academicYear && (
                      <span className="mt-1.5 inline-flex rounded-full border border-green-700/20 bg-green-900/30 px-2.5 py-0.5 text-xs text-green-400">
                        {label(cls.academicYear)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin && (
                      <button
                        onClick={() => setManagingClass(cls)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] text-slate-500 transition-colors hover:border-green-500/30 hover:text-green-400"
                        title="Manage class"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-700/20 bg-green-900/40">
                      <School className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Teacher */}
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 shrink-0 text-slate-500" />
                  {label(cls.classTeacher) !== '—' ? (
                    <span className="font-medium text-slate-200 truncate">{label(cls.classTeacher)}</span>
                  ) : (
                    <span className="italic text-slate-500">
                      Unassigned
                      {isAdmin && (
                        <button onClick={() => setManagingClass(cls)} className="ml-1.5 text-green-500 hover:underline not-italic text-xs">
                          Assign →
                        </button>
                      )}
                    </span>
                  )}
                </div>

                {/* Capacity bar — click opens roster */}
                <button className="group w-full space-y-1.5 text-left" onClick={() => setRosterClass(cls)}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Students</span>
                    <span className="font-semibold text-slate-200 transition-colors group-hover:text-green-400">
                      {enrolled} / {capacity}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${fillPct}%` }} />
                  </div>
                  <p className="text-right text-xs text-slate-500 transition-colors group-hover:text-green-400">
                    {fillPct}% full · click to view roster
                  </p>
                </button>

                {/* Subjects count */}
                {cls.subjects && cls.subjects.length > 0 && (
                  <div className="flex items-center gap-1.5 border-t border-white/[0.05] pt-3 text-xs text-slate-500">
                    <BookOpen className="h-3.5 w-3.5 text-green-700" />
                    <span>{cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''} assigned</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Roster slide-out panel */}
      <RosterDrawer cls={rosterClass} onClose={() => setRosterClass(null)} />
    </div>
  )
}
