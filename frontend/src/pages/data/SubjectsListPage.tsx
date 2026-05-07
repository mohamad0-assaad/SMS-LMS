import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'
import {
  BookOpen,
  CheckCircle,
  MoreHorizontal,
  Trash2,
  User,
  XCircle,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type TeacherRef = { _id: string; name: string; email?: string }

type SubjectRow = {
  _id: string
  name: string
  code: string
  isActive?: boolean
  teacher?: TeacherRef | TeacherRef[]
}

type SubjectsRes = { subjects?: SubjectRow[] }

type ClassRow = { _id: string; name: string; subjects?: string[] }
type ClassesRes = { classes: ClassRow[] }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function teacherList(t: TeacherRef | TeacherRef[] | undefined): TeacherRef[] {
  if (!t) return []
  return Array.isArray(t) ? t : [t]
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

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

// ─── Dropdown menu ─────────────────────────────────────────────────────────────

function SubjectMenu({
  onDelete,
}: {
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 hover:border-green-500/30 hover:text-white transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-2xl">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Actions
          </p>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#111111] p-6 shadow-2xl">
        <h2 className="text-base font-bold text-white mb-1">Delete Subject</h2>
        <p className="text-sm text-slate-400 mb-5">
          Are you sure you want to delete <span className="text-white font-medium">"{name}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-500"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function SubjectsListPage() {
  const { role } = useParams()
  const isAdmin = role === 'admin'
  const isTeacher = role === 'teacher'

  const [rows, setRows] = useState<SubjectRow[]>([])
  const [classMap, setClassMap] = useState<Map<string, string[]>>(new Map())
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingSubject, setDeletingSubject] = useState<SubjectRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([
      getJson<SubjectsRes>('/api/subjects?page=1&limit=200', 30_000),
      getJson<ClassesRes>('/api/classes?page=1&limit=200', 30_000),
    ])
      .then(([sd, cd]) => {
        setRows(sd.subjects ?? [])
        const map = new Map<string, string[]>()
        for (const cls of cd.classes ?? []) {
          for (const sid of cls.subjects ?? []) {
            const key = String(sid)
            map.set(key, [...(map.get(key) ?? []), cls.name])
          }
        }
        setClassMap(map)
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function confirmDelete() {
    if (!deletingSubject) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/subjects/delete/${deletingSubject._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message || 'Failed to delete')
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

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {deletingSubject && (
        <DeleteConfirm
          name={deletingSubject.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingSubject(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Subjects</h1>
        <p className="text-sm text-slate-500">
          {loading
            ? 'Loading…'
            : isTeacher
              ? `${rows.filter((s) => classMap.has(s._id)).length} subjects in your classes`
              : `${rows.length} subjects`}
        </p>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !rows.length || (isTeacher && rows.every(s => !classMap.has(s._id))) ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-center">
          <BookOpen className="h-10 w-10 text-green-800/50" />
          <p className="text-slate-400">No subjects yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(isTeacher ? rows.filter((s) => classMap.has(s._id)) : rows).map((s) => {
            const teachers = teacherList(s.teacher)
            const assignedClasses = classMap.get(s._id) ?? []

            return (
              <div
                key={s._id}
                className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-4 transition-shadow hover:shadow-md hover:shadow-black/40"
              >
                {/* Top row: icon + name + menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-700/20 bg-green-900/40">
                      <BookOpen className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold leading-tight text-white">
                        {s.name}
                      </h3>
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
                      <SubjectMenu onDelete={() => setDeletingSubject(s)} />
                    )}
                  </div>
                </div>

                {/* Assigned classes */}
                {assignedClasses.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Assigned to
                    </p>
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
                      <span className="text-xs italic text-slate-600">
                        No instructors assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
