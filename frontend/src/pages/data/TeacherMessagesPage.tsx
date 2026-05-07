import { useEffect, useState } from 'react'
import { getJson, postJson } from '../../lib/api'
import { CheckCircle, Loader2, Send } from 'lucide-react'

type Student = { _id: string; name: string; className: string }
type SentMsg = { _id: string; subject: string; body: string; to: string; studentName: string; read: boolean; createdAt: string }

export function TeacherMessagesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [sent, setSent] = useState<SentMsg[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingSent, setLoadingSent] = useState(true)

  const [studentId, setStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function loadSent() {
    setLoadingSent(true)
    getJson<SentMsg[]>('/api/messages/sent')
      .then((d) => setSent(d))
      .catch(() => {})
      .finally(() => setLoadingSent(false))
  }

  useEffect(() => {
    getJson<{ students: Student[] }>('/api/messages/my-students')
      .then((d) => {
        const list = d.students ?? []
        setStudents(list)
        if (list[0]) setStudentId(list[0]._id)
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false))
    loadSent()
  }, [])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setSending(true); setErr(null); setSuccess(null)
    try {
      const data = await postJson<{ sentTo: string[] }>('/api/messages', { studentId, subject, body })
      setSuccess(`Sent to: ${data.sentTo.join(', ')}`)
      setSubject(''); setBody('')
      loadSent()
    } catch (ex: any) {
      setErr(ex.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Messages to Parents</h1>
        <p className="text-sm text-slate-500">Send a message to a student's parent(s) directly.</p>
      </div>

      {/* Compose */}
      <form onSubmit={send} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Message</h2>

        {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-400">Student</span>
            {loadingStudents ? (
              <p className="mt-1 text-xs text-slate-500">Loading students…</p>
            ) : students.length === 0 ? (
              <p className="mt-1 text-xs text-amber-400">No students in your classes yet.</p>
            ) : (
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d0d0d] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} · {s.className}</option>
                ))}
              </select>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-400">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="e.g. Homework reminder"
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-400">Message</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            placeholder="Write your message here…"
            className="mt-1 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
          />
        </label>

        <button
          type="submit"
          disabled={sending || !studentId || !subject.trim() || !body.trim()}
          className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending…' : 'Send Message'}
        </button>
      </form>

      {/* Sent */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sent Messages</h2>
        {loadingSent ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : sent.length === 0 ? (
          <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/[0.07] text-sm text-slate-500">
            No messages sent yet.
          </div>
        ) : (
          sent.map((m) => (
            <div key={m._id} className="rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{m.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    To: <span className="text-slate-400">{m.to}</span>
                    {' '}· About: <span className="text-slate-400">{m.studentName}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">{m.body}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-slate-600">{new Date(m.createdAt).toLocaleDateString()}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.read ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {m.read ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
