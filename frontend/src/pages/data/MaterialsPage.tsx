import { useEffect, useState } from 'react'
import { apiFetch, getJson, getProfile } from '../../lib/api'
import { BookOpen, Download, Trash2, Upload } from 'lucide-react'

type Material = { _id: string; title: string; description?: string; subject: string; className: string; uploadedByName: string; fileName: string; fileSize: number; fileType: string; downloadUrl: string; createdAt: string }
type ClassOption = { _id: string; name: string }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MaterialsPage() {
  const [role, setRole] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ title: '', description: '', subject: '', classId: '' })
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getJson<{ materials: Material[] }>('/api/materials')
      .then((d) => setMaterials(d.materials ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getProfile().then((p) => {
      setRole(p?.role ?? null)
      if (p && p.role !== 'student') {
        getJson<any>('/api/classes').then((d) => setClasses(d.classes ?? []))
      }
    })
    load()
  }, [])

  async function upload(e: { preventDefault(): void }) {
    e.preventDefault(); setErr(null); setMsg(null)
    if (!file) { setErr('Select a file first'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('subject', form.subject)
      if (form.classId) fd.append('classId', form.classId)
      const res = await apiFetch('/api/materials/upload', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || 'Upload failed')
      setMsg('Material uploaded!'); setShowForm(false); setFile(null); setForm({ title: '', description: '', subject: '', classId: '' }); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setUploading(false) }
  }

  async function remove(id: string) {
    if (!confirm('Delete this material?')) return
    await apiFetch(`/api/materials/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Study Materials</h1>
        {role !== 'student' && (
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
            <Upload className="h-4 w-4" /> Upload
          </button>
        )}
      </div>

      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}

      {showForm && (
        <form onSubmit={upload} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Upload Material</h2>
          {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{err}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm"><span className="text-slate-400">Title</span>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50" />
            </label>
            <label className="block text-sm"><span className="text-slate-400">Subject</span>
              <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required placeholder="e.g. Mathematics" className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50" />
            </label>
            <label className="block text-sm"><span className="text-slate-400">Class (optional)</span>
              <select value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d1525] px-3 py-2 text-sm text-white">
                <option value="">All classes</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-sm"><span className="text-slate-400">File</span>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required className="mt-1 w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-sm file:text-white" />
            </label>
          </div>
          <label className="block text-sm"><span className="text-slate-400">Description (optional)</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50 resize-none" />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={uploading} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : !materials.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-500"><BookOpen className="h-10 w-10 opacity-30" /><p className="text-sm">No materials yet</p></div>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <div key={m._id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{m.title}</p>
                {m.description && <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{m.description}</p>}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>{m.subject}</span>
                  <span>· {m.className}</span>
                  <span>· {formatSize(m.fileSize)}</span>
                  <span>· {m.uploadedByName}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={m.downloadUrl} download className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 hover:bg-teal-500/20">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                {role !== 'student' && (
                  <button onClick={() => remove(m._id)} className="rounded-lg p-2 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
