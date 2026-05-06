import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, getJson } from '../../lib/api'

type IdRow = { _id: string; name: string }
type ClassesRes = { classes: IdRow[] }
type SubjectsRes = { subjects?: IdRow[] }

export function TeacherAiExamPage() {
  const { role } = useParams()
  const navigate = useNavigate()
  const base = `/app/${role ?? 'teacher'}`
  const [classes, setClasses] = useState<IdRow[]>([])
  const [subjects, setSubjects] = useState<IdRow[]>([])
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('Data structures')
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState(10)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    Promise.all([
      getJson<ClassesRes>('/api/classes?page=1&limit=100'),
      getJson<SubjectsRes>('/api/subjects?page=1&limit=100'),
    ])
      .then(([cl, su]) => {
        if (c) return
        const cls = cl.classes ?? []
        const subs = su.subjects ?? []
        setClasses(cls); setSubjects(subs)
        if (cls[0]) setClassId((v) => v || cls[0]!._id)
        if (subs[0]) setSubjectId((v) => v || subs[0]!._id)
      })
      .catch((e: Error) => { if (!c) setLoadErr(e.message) })
    return () => { c = true }
  }, [])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!topic.trim() || !classId || !subjectId) { setErr('Topic, class, and subject are required.'); return }
    setBusy(true)
    try {
      const res = await apiFetch('/api/exams/generate', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() || undefined, class: classId, subject: subjectId, topic: topic.trim(), difficulty, count }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string; examId?: string }
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`)
      setMsg(data.message ?? 'Exam created!')
      if (data.examId) navigate(`${base}/exams/${data.examId}`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const inputCls = 'mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20'
  const labelCls = 'block text-sm font-medium text-slate-300'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to={`${base}/exams`} className="text-sm font-medium text-green-400 hover:underline">← Back to exams</Link>
      <div>
        <h1 className="text-lg font-semibold text-white">AI Exam Generator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generates questions via Gemini AI and saves the exam directly.
        </p>
      </div>
      {loadErr && <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">{loadErr}</p>}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111111] p-6 shadow-lg">
        {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
        {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{msg}</p>}
        <div>
          <label className={labelCls}>Title (optional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm — Data Structures" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Class</label>
          <select required value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
            <option value="">— Select —</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Subject</label>
          <select required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls}>
            <option value="">— Select —</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Topic</label>
          <input required value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputCls}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Question count</label>
            <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value) || 10)} className={inputCls} />
          </div>
        </div>
        <button type="submit" disabled={busy || !classes.length || !subjects.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate exam
        </button>
      </form>
    </div>
  )
}
