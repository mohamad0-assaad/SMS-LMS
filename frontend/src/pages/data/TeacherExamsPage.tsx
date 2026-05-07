import { ClipboardList, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, bustCache } from '../../lib/api'
import { SkeletonTable } from '../../components/ui/Skeleton'

type Pop = { name?: string } | string
type ExamRow = { _id: string; title: string; duration?: number; dueDate?: string; isActive?: boolean; questions?: unknown[]; subject?: Pop; class?: Pop }

function label(p: Pop | undefined): string {
  if (p == null) return '—'
  if (typeof p === 'string') return p
  return p.name ?? '—'
}

type TeacherExamsPageProps = { title?: string; description?: string }

export function TeacherExamsPage({ title = 'Your exams', description = 'Drafts and published exams you created' }: TeacherExamsPageProps) {
  const { role } = useParams()
  const base = `/app/${role ?? 'teacher'}`
  const [exams, setExams] = useState<ExamRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    setLoading(true); setErr(null)
    apiFetch('/api/exams')
      .then(async (res) => {
        const data = await res.json().catch(() => [])
        if (!res.ok) throw new Error((data as { message?: string }).message ?? 'Failed to load exams')
        return data as ExamRow[]
      })
      .then((list) => { if (!c) setExams(Array.isArray(list) ? list : []) })
      .catch((e: Error) => { if (!c) setErr(e.message) })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [])

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This also removes all student submissions.`)) return
    setDeleting(id)
    try {
      const res = await apiFetch(`/api/exams/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as { message?: string }).message ?? 'Delete failed')
      }
      setExams((prev) => prev.filter((e) => e._id !== id))
      bustCache('/api/exams')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Link to={`${base}/ai/exam`} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
          <Sparkles className="h-4 w-4" /> Generate with AI
        </Link>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      ) : !exams.length ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#111111] p-10 text-center shadow-lg">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 font-medium text-slate-300">No exams yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first assessment with the AI generator.</p>
          <Link to={`${base}/ai/exam`} className="mt-4 inline-block rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
            Generate exam
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {exams.map((ex, i) => {
            const qCount = Array.isArray(ex.questions) ? ex.questions.length : 0
            const draft = !ex.isActive || qCount === 0
            return (
              <li key={ex._id} className="group relative">
                <Link to={`${base}/exams/${ex._id}`}
                  className="flex h-full flex-col rounded-xl border border-white/[0.08] bg-[#111111] p-5 shadow-lg transition hover:border-green-500/30">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-green-400">Exam {i + 1}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${draft ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {draft ? 'Draft' : 'Published'}
                    </span>
                  </div>
                  <h2 className="mt-2 font-semibold text-white">{ex.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{label(ex.class)} · {label(ex.subject)}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {qCount} questions · {ex.duration ?? '—'} min
                    {ex.dueDate ? ` · due ${new Date(ex.dueDate).toLocaleDateString()}` : ''}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(ex._id, ex.title)}
                  disabled={deleting === ex._id}
                  title="Delete exam"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 opacity-0 transition hover:bg-rose-500/20 group-hover:opacity-100 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
