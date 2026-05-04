import { useEffect, useState } from 'react'
import { apiFetch, getJson, getProfile, postJson } from '../../lib/api'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'

type Assignment = { _id: string; title: string; description: string; dueDate: string; subject?: { name: string }; class?: { name: string }; teacher?: { name: string } }
type SubjectOption = { _id: string; name: string }
type ClassOption = { _id: string; name: string }

export function AssignmentsPage() {
  const [role, setRole] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', subject: '', class: '', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getJson<{ assignments: Assignment[] }>('/api/assignments')
      .then((d) => setAssignments(d.assignments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getProfile().then((p) => {
      setRole(p?.role ?? null)
      if (p && p.role !== 'student') {
        Promise.all([
          getJson<any>('/api/subjects').then((d) => setSubjects(d.subjects ?? [])),
          getJson<any>('/api/classes').then((d) => setClasses(d.classes ?? [])),
        ])
      }
    })
    load()
  }, [])

  async function create(e: { preventDefault(): void }) {
    e.preventDefault(); setErr(null); setSaving(true)
    try {
      await postJson('/api/assignments', form)
      setShowForm(false); setForm({ title: '', description: '', subject: '', class: '', dueDate: '' }); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!confirm('Delete this assignment?')) return
    await apiFetch(`/api/assignments/${id}`, { method: 'DELETE' })
    load()
  }

  const overdue = (date: string) => new Date(date) < new Date()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Assignments</h1>
        {role !== 'student' && (
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
            <Plus className="h-4 w-4" /> New Assignment
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={create} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Create Assignment</h2>
          {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-400">Title</span>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Due Date</span>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Subject</span>
              <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d1525] px-3 py-2 text-sm text-white">
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Class</span>
              <select value={form.class} onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d1525] px-3 py-2 text-sm text-white">
                <option value="">Select class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-400">Description</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={3} className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50 resize-none" />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : !assignments.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
          <ClipboardList className="h-10 w-10 opacity-30" />
          <p className="text-sm">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{a.title}</p>
                  {overdue(a.dueDate) && <span className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">Overdue</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{a.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  {a.subject && <span>{a.subject.name}</span>}
                  {a.class && <span>· {a.class.name}</span>}
                  <span>· Due {new Date(a.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              {role !== 'student' && (
                <button onClick={() => remove(a._id)} className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
