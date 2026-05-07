import { useEffect, useState } from 'react'
import { apiFetch, getJson } from '../../lib/api'
import { Mail, MailOpen, MessageSquare } from 'lucide-react'

type Msg = { _id: string; subject: string; body: string; from: string; studentName: string; read: boolean; createdAt: string }

export function ParentMessagesPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getJson<Msg[]>('/api/messages/inbox')
      .then((d) => setMsgs(d))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function open(msg: Msg) {
    setOpenId(openId === msg._id ? null : msg._id)
    if (!msg.read) {
      await apiFetch(`/api/messages/${msg._id}/read`, { method: 'PUT' }).catch(() => {})
      setMsgs((prev) => prev.map((m) => m._id === msg._id ? { ...m, read: true } : m))
    }
  }

  const unread = msgs.filter((m) => !m.read).length

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Messages from Teachers</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading…' : `${msgs.length} message${msgs.length !== 1 ? 's' : ''}${unread > 0 ? ` · ${unread} unread` : ''}`}
          </p>
        </div>
        {unread > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-green-600 px-2 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111] h-20" />
          ))}
        </div>
      ) : msgs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
          <MessageSquare className="h-12 w-12 opacity-20" />
          <p className="text-base font-semibold text-slate-300">No messages yet</p>
          <p className="text-sm">Messages from your children's teachers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {msgs.map((m) => {
            const isOpen = openId === m._id
            return (
              <div
                key={m._id}
                className={`rounded-2xl border transition-all ${isOpen ? 'border-green-700/30 bg-[#0f1f10]' : m.read ? 'border-white/[0.07] bg-[#111111]' : 'border-green-700/20 bg-green-900/[0.08]'}`}
              >
                <button
                  type="button"
                  onClick={() => open(m)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left"
                >
                  <span className="mt-0.5 shrink-0">
                    {m.read
                      ? <MailOpen className="h-4 w-4 text-slate-500" />
                      : <Mail className="h-4 w-4 text-green-400" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${m.read ? 'text-slate-300' : 'text-white'}`}>
                        {m.subject}
                        {!m.read && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-green-400 align-middle" />}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-600">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      From <span className="text-slate-400">{m.from}</span>
                      {' '}· About <span className="text-slate-400">{m.studentName}</span>
                    </p>
                    {!isOpen && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-1">{m.body}</p>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.06] px-5 py-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
