import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'

type YearRow = { _id: string; name: string }
type YearsRes = { years?: YearRow[] }
type UserRow = { _id: string; name: string; role: string }
type UsersRes = { users: UserRow[] }
type SubjectRow = { _id: string; name: string; code: string }
type SubjectsRes = { subjects?: SubjectRow[] }

export function CreateClassPage() {
  const { role } = useParams()
  const base = `/app/${role ?? 'admin'}`
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(30)
  const [academicYearId, setAcademicYearId] = useState('')
  const [classTeacherId, setClassTeacherId] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [years, setYears] = useState<YearRow[]>([])
  const [teachers, setTeachers] = useState<UserRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    Promise.all([
      getJson<YearsRes>('/api/academic-years?page=1&limit=100'),
      getJson<UsersRes>('/api/users?page=1&limit=100&role=teacher'),
      getJson<SubjectsRes>('/api/subjects?page=1&limit=200'),
    ])
      .then(([y, u, s]) => {
        if (c) return
        const yList = y.years ?? []
        setYears(yList)
        if (yList[0]) setAcademicYearId(yList[0]!._id)
        setTeachers((u.users ?? []).filter((x) => x.role === 'teacher'))
        setSubjects(s.subjects ?? [])
      })
      .catch((e: Error) => { if (!c) setLoadErr(e.message) })
    return () => { c = true }
  }, [])

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!name.trim() || !academicYearId) { setErr('Name and academic year are required.'); return }
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/classes/create', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          academicYear: academicYearId,
          capacity,
          subjects: [...selectedSubjects],
          ...(classTeacherId ? { classTeacher: classTeacherId } : {})
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`)
      setMsg('Class created.')
      setName('')
      setSelectedSubjects(new Set())
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20'
  const labelCls = 'block text-sm font-medium text-slate-300'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to={`${base}/classes`} className="text-sm font-medium text-green-400 hover:underline">← Back to classes</Link>
      <div>
        <h1 className="text-lg font-semibold text-white">Create class</h1>
      </div>
      {loadErr && <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">{loadErr}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-6 shadow-lg">
        {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
        {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{msg}</p>}
        <div>
          <label className={labelCls}>Class name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 10 A" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Academic year</label>
          <select required value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className={inputCls}>
            <option value="">— Select —</option>
            {years.map((y) => <option key={y._id} value={y._id}>{y.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Capacity</label>
          <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 30)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Class teacher (optional)</label>
          <select value={classTeacherId} onChange={(e) => setClassTeacherId(e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Subjects (optional)</label>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.03] divide-y divide-white/[0.04]">
            {subjects.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">No subjects available.</p>
            ) : (
              subjects.map((s) => (
                <label key={s._id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.has(s._id)}
                    onChange={() => toggleSubject(s._id)}
                    className="h-4 w-4 rounded accent-green-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.code}</p>
                  </div>
                  {selectedSubjects.has(s._id) && (
                    <span className="shrink-0 rounded-full border border-green-700/20 bg-green-900/30 px-2 py-0.5 text-[10px] text-green-400">✓</span>
                  )}
                </label>
              ))
            )}
          </div>
          {selectedSubjects.size > 0 && (
            <p className="mt-2 text-xs text-green-400">{selectedSubjects.size} subject{selectedSubjects.size !== 1 ? 's' : ''} selected</p>
          )}
        </div>
        <button type="submit" disabled={submitting || !years.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create class
        </button>
      </form>
    </div>
  )
}
