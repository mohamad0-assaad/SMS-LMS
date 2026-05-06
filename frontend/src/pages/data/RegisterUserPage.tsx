import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'
import type { AppRole } from '../../types/role'

type ClassRow = { _id: string; name: string }
type ClassesRes = { classes: ClassRow[] }

export function RegisterUserPage() {
  const { role: viewerRole } = useParams()
  const base = `/app/${viewerRole ?? 'admin'}`
  const isTeacher = viewerRole === 'teacher'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newRole, setNewRole] = useState<AppRole>('student')
  const [studentClassId, setStudentClassId] = useState('')
  const [teacherClassId, setTeacherClassId] = useState('')
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [classesErr, setClassesErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    getJson<ClassesRes>('/api/classes?page=1&limit=100')
      .then((r) => {
        if (!c) {
          setClasses(r.classes ?? [])
          const list = r.classes ?? []
          if (list[0]) {
            setStudentClassId((id) => id || list[0]!._id)
            setTeacherClassId((id) => id || list[0]!._id)
          }
        }
      })
      .catch((e: Error) => { if (!c) setClassesErr(e.message) })
    return () => { c = true }
  }, [])

  useEffect(() => {
    if (isTeacher) setNewRole('student')
  }, [isTeacher])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!name.trim() || !email.trim() || !password) { setErr('Name, email, and password are required.'); return }
    if (newRole === 'student' && !studentClassId) { setErr('Select a class for the student.'); return }
    if (!isTeacher && newRole === 'teacher' && !teacherClassId) { setErr('Select the class this teacher leads.'); return }
    const body: Record<string, unknown> = { name: name.trim(), email: email.trim(), password, role: newRole, isActive: true }
    if (newRole === 'student') body.studentClass = studentClassId
    if (!isTeacher && newRole === 'teacher') body.assignedClass = teacherClassId
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/users/register', { method: 'POST', body: JSON.stringify(body) })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`)
      setMsg('User registered successfully.')
      setName(''); setEmail(''); setPassword('')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20'
  const labelCls = 'block text-sm font-medium text-slate-300'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to={isTeacher ? `${base}/students` : `${base}/users`} className="text-sm font-medium text-green-400 hover:underline">
        {isTeacher ? '← Back to students' : '← Back to users'}
      </Link>
      <div>
        <h1 className="text-lg font-semibold text-white">Add user</h1>
        <p className="mt-1 text-sm text-slate-500">Creates an account via POST /api/users/register</p>
      </div>
      {classesErr && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          Could not load classes: {classesErr}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-6 shadow-lg">
        {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
        {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{msg}</p>}
        <div>
          <label className={labelCls}>Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </div>
        {isTeacher ? (
          <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
            Registering a <strong className="text-white">student</strong> (teachers can only add students).
          </p>
        ) : (
          <div>
            <label className={labelCls}>Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as AppRole)} className={inputCls}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        )}
        {newRole === 'student' && (
          <div>
            <label className={labelCls}>Class</label>
            <select required value={studentClassId} onChange={(e) => setStudentClassId(e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {!isTeacher && newRole === 'teacher' && (
          <div>
            <label className={labelCls}>Class (class teacher)</label>
            <select required value={teacherClassId} onChange={(e) => setTeacherClassId(e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <button type="submit" disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Register
        </button>
      </form>
    </div>
  )
}
