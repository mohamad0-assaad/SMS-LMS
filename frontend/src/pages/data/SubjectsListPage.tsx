import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, getJson, getProfile } from '../../lib/api'
import { BookOpen, CheckCircle, Loader2, MoreHorizontal, Pencil, Plus, Trash2, User, X, XCircle } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type TeacherRef  = { _id: string; name: string; email?: string }
type SubjectRow  = { _id: string; name: string; code: string; isActive?: boolean; teacher?: TeacherRef | TeacherRef[] }
type ClassRow    = { _id: string; name: string; subjects?: string[] }
type UserRow     = { _id: string; name: string; email?: string }
type SubjectsRes = { subjects?: SubjectRow[] }
type ClassesRes  = { classes: ClassRow[] }
type UsersRes    = { users?: UserRow[] }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function teacherList(t: TeacherRef | TeacherRef[] | undefined): TeacherRef[] {
  if (!t) return []
  return Array.isArray(t) ? t : [t]
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/[0.06]" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded bg-white/[0.06]" />
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-20 rounded bg-white/[0.06]" />
        <div className="flex gap-1.5">
          <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-24 rounded-full bg-white/[0.06]" />
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#111111] p-6 shadow-2xl">
        <h2 className="text-base font-bold text-white mb-1">Delete Subject</h2>
        <p className="text-sm text-slate-400 mb-5">
          Are you sure you want to delete{' '}
          <span className="font-medium text-white">"{name}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
            Delete
          </button>
          <button onClick={onCancel} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add / Edit modal ──────────────────────────────────────────────────────────

function SubjectModal({
  editing,
  allTeachers,
  allClasses,
  onClose,
  onSaved,
}: {
  editing: SubjectRow | null
  allTeachers: UserRow[]
  allClasses: ClassRow[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]         = useState(editing?.name ?? '')
  const [code, setCode]         = useState(editing?.code ?? '')
  const [isActive, setIsActive] = useState(editing?.isActive !== false)
  const [selTeachers, setSelTeachers] = useState<string[]>(() =>
    teacherList(editing?.teacher).map((t) => t._id),
  )
  const [selClasses, setSelClasses] = useState<string[]>(() => {
    if (!editing) return []
    return allClasses
      .filter((c) => (c.subjects ?? []).map(String).includes(editing._id))
      .map((c) => c._id)
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  function toggleTeacher(id: string) {
    setSelTeachers((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }
  function toggleClass(id: string) {
    setSelClasses((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) { setErr('Name and code are required.'); return }
    setSaving(true); setErr(null)
    try {
      let subjectId: string

      if (editing) {
        const res = await apiFetch(`/api/subjects/update/${editing._id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            teacher: selTeachers,
            isActive,
          }),
        })
        const d = (await res.json().catch(() => ({}))) as { message?: string }
        if (!res.ok) throw new Error(d.message || 'Failed to update subject')
        subjectId = editing._id
      } else {
        const res = await apiFetch('/api/subjects/create', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            teacher: selTeachers,
            isActive,
          }),
        })
        const d = (await res.json().catch(() => ({}))) as { _id?: string; message?: string }
        if (!res.ok) throw new Error(d.message || 'Failed to create subject')
        if (!d._id) throw new Error('No subject ID returned from server')
        subjectId = d._id
      }

      // Sync class assignments in parallel
      await Promise.all(
        allClasses.map(async (cls) => {
          const current    = (cls.subjects ?? []).map(String)
          const wasIn      = current.includes(subjectId)
          const shouldBeIn = selClasses.includes(cls._id)
          if (wasIn === shouldBeIn) return
          const updated = shouldBeIn
            ? [...current, subjectId]
            : current.filter((id) => id !== subjectId)
          const r = await apiFetch(`/api/classes/update/${cls._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ subjects: updated }),
          })
          if (!r.ok) throw new Error(`Failed to update class "${cls.name}"`)
        }),
      )

      onSaved()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 placeholder:text-slate-600'
  const scrollListCls =
    'max-h-40 overflow-y-auto rounded-xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.04]'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-base font-bold text-white">
            {editing ? 'Edit Subject' : 'Add Subject'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="space-y-5 p-6">
          {err && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {err}
            </p>
          )}

          {/* Name + Code */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mathematics"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Code *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MATH101"
                className={inputCls}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive((a) => !a)}
              className={`relative h-5 w-9 rounded-full transition-colors ${isActive ? 'bg-green-600' : 'bg-white/[0.12]'}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isActive ? 'left-[18px]' : 'left-0.5'}`}
              />
            </button>
            <span className="text-sm text-slate-300">{isActive ? 'Active' : 'Archived'}</span>
          </div>

          {/* Teachers */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Instructors
              {selTeachers.length > 0 && (
                <span className="ml-2 rounded-full bg-green-900/40 px-1.5 py-0.5 text-[10px] text-green-400">
                  {selTeachers.length} selected
                </span>
              )}
            </label>
            {allTeachers.length === 0 ? (
              <p className="text-xs italic text-slate-500">No teachers found in the system.</p>
            ) : (
              <div className={scrollListCls}>
                {allTeachers.map((t) => (
                  <label
                    key={t._id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selTeachers.includes(t._id)}
                      onChange={() => toggleTeacher(t._id)}
                      className="h-4 w-4 accent-green-500"
                    />
                    <span className="text-sm text-slate-300">{t.name}</span>
                    {t.email && <span className="ml-auto text-xs text-slate-600 truncate max-w-[120px]">{t.email}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Classes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Assign to Classes
              {selClasses.length > 0 && (
                <span className="ml-2 rounded-full bg-green-900/40 px-1.5 py-0.5 text-[10px] text-green-400">
                  {selClasses.length} selected
                </span>
              )}
            </label>
            {allClasses.length === 0 ? (
              <p className="text-xs italic text-slate-500">No classes found. Create classes first.</p>
            ) : (
              <div className={scrollListCls}>
                {allClasses.map((c) => (
                  <label
                    key={c._id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selClasses.includes(c._id)}
                      onChange={() => toggleClass(c._id)}
                      className="h-4 w-4 accent-green-500"
                    />
                    <span className="text-sm text-slate-300">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Subject'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Subject card ──────────────────────────────────────────────────────────────

function SubjectCard({
  s,
  assignedClasses,
  isAdmin,
  onEdit,
  onDelete,
}: {
  s: SubjectRow
  assignedClasses: string[]
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const teachers = teacherList(s.teacher)

  useEffect(() => {
    if (!menuOpen) return
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-4 transition-shadow hover:shadow-md hover:shadow-black/40">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-700/20 bg-green-900/40">
            <BookOpen className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight text-white">{s.name}</h3>
            <span className="font-mono text-xs text-slate-500">{s.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s.isActive === false ? (
            <span className="flex items-center gap-1 rounded-full border border-amber-700/20 bg-amber-900/30 px-2 py-0.5 text-xs text-amber-400">
              <XCircle className="h-3 w-3" /> Archived
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-green-700/20 bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
              <CheckCircle className="h-3 w-3" /> Active
            </span>
          )}
          {isAdmin && (
            <div ref={ref} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 hover:border-green-500/30 hover:text-white transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-2xl">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </p>
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assigned classes */}
      {assignedClasses.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Assigned to</p>
          <div className="flex flex-wrap gap-1.5">
            {assignedClasses.map((cls) => (
              <span
                key={cls}
                className="rounded-full border border-green-700/25 bg-green-900/25 px-2.5 py-0.5 text-xs text-green-300"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructors */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <User className="h-3 w-3" /> Instructors
        </div>
        <div className="flex flex-wrap gap-1.5">
          {teachers.length > 0 ? (
            teachers.map((t) => (
              <span
                key={t._id}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs text-slate-300"
              >
                {t.name}
              </span>
            ))
          ) : (
            <span className="text-xs italic text-slate-600">No instructors assigned</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function SubjectsListPage() {
  const { role } = useParams()
  const isAdmin   = role === 'admin'
  const isTeacher = role === 'teacher'

  const [rows, setRows]             = useState<SubjectRow[]>([])
  const [allClasses, setAllClasses] = useState<ClassRow[]>([])
  const [allTeachers, setAllTeachers] = useState<UserRow[]>([])
  const [classMap, setClassMap]     = useState<Map<string, string[]>>(new Map())
  const [myId, setMyId]             = useState('')        // teacher's own ID
  const [loadingMyId, setLoadingMyId] = useState(isTeacher)
  const [err, setErr]               = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<SubjectRow | null>(null)
  const [deletingSubject, setDeletingSubject] = useState<SubjectRow | null>(null)
  const [deleting, setDeleting]     = useState(false)

  function load() {
    setLoading(true)
    const fetches: Promise<any>[] = [
      getJson<SubjectsRes>('/api/subjects?page=1&limit=200', 30_000),
      getJson<ClassesRes>('/api/classes?page=1&limit=200', 30_000),
    ]
    if (isAdmin) {
      fetches.push(getJson<UsersRes>('/api/users?role=teacher&page=1&limit=100'))
    }

    Promise.all(fetches)
      .then(([sd, cd, ud]) => {
        setRows(sd.subjects ?? [])
        const clsList: ClassRow[] = cd.classes ?? []
        setAllClasses(clsList)
        const map = new Map<string, string[]>()
        for (const cls of clsList) {
          for (const sid of cls.subjects ?? []) {
            const key = String(sid)
            map.set(key, [...(map.get(key) ?? []), cls.name])
          }
        }
        setClassMap(map)
        if (ud) setAllTeachers((ud as UsersRes).users ?? [])
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Teacher: fetch own profile to filter by their ID in subject.teacher[]
  useEffect(() => {
    if (!isTeacher) return
    setLoadingMyId(true)
    getProfile()
      .then((p) => { if (p?._id) setMyId(p._id) })
      .catch(() => {})
      .finally(() => setLoadingMyId(false))
  }, [isTeacher])

  async function confirmDelete() {
    if (!deletingSubject) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/subjects/delete/${deletingSubject._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as any).message || 'Failed to delete')
      }
      setDeletingSubject(null)
      load()
    } catch (e: any) {
      setErr(e.message)
      setDeletingSubject(null)
    } finally {
      setDeleting(false)
    }
  }

  function openAdd() { setEditing(null); setShowModal(true) }
  function openEdit(s: SubjectRow) { setEditing(s); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null) }

  // Teachers only see subjects where their ID is in the teacher[] array
  const visibleRows = isTeacher
    ? rows.filter((s) => teacherList(s.teacher).some((t) => t._id === myId))
    : rows

  const isPageLoading = loading || (isTeacher && loadingMyId)

  return (
    <div className="mx-auto max-w-6xl space-y-5">

      {deletingSubject && (
        <DeleteConfirm
          name={deletingSubject.name}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeletingSubject(null)}
        />
      )}

      {showModal && (
        <SubjectModal
          editing={editing}
          allTeachers={allTeachers}
          allClasses={allClasses}
          onClose={closeModal}
          onSaved={() => { closeModal(); load() }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Subjects</h1>
          <p className="text-sm text-slate-500">
            {isPageLoading
              ? 'Loading…'
              : isTeacher
                ? `${visibleRows.length} subject${visibleRows.length !== 1 ? 's' : ''} assigned to you`
                : `${visibleRows.length} subject${visibleRows.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        )}
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
      )}

      {/* Grid */}
      {isPageLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.08] text-center">
          <BookOpen className="h-10 w-10 text-green-800/40" />
          <div>
            <p className="text-slate-400">
              {isTeacher ? 'No subjects assigned to you yet.' : 'No subjects yet.'}
            </p>
            {isTeacher && (
              <p className="mt-1 text-xs text-slate-600">Ask an admin to assign you as an instructor on a subject.</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-xl border border-green-700/30 bg-green-900/20 px-4 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900/40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add your first subject
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRows.map((s) => (
            <SubjectCard
              key={s._id}
              s={s}
              assignedClasses={classMap.get(s._id) ?? []}
              isAdmin={isAdmin}
              onEdit={() => openEdit(s)}
              onDelete={() => setDeletingSubject(s)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
