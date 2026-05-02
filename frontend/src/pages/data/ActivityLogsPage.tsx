import { useEffect, useState } from 'react'
import { getJson } from '../../lib/api'

type LogRow = {
  _id: string
  action?: string
  details?: string
  createdAt?: string
  user?: { name?: string; email?: string; role?: string }
}

type LogsResponse = {
  logs: LogRow[]
  page: number
  pages: number
  total: number
}

export function ActivityLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)
    getJson<LogsResponse>('/api/activities?page=1&limit=30')
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Activity logs</h1>
        <p className="text-sm text-slate-500">
          Live data from <code className="rounded bg-white/[0.06] px-1 text-slate-300">GET /api/activities</code>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : err ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {err}
        </div>
      ) : !data?.logs.length ? (
        <p className="text-sm text-slate-400">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.logs.map((log) => (
            <li
              key={log._id}
              className="rounded-xl border border-white/[0.08] bg-[#111827] px-4 py-3 shadow-lg"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-white">{log.action ?? 'Activity'}</span>
                <span className="text-xs text-slate-400">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                </span>
              </div>
              {log.details ? (
                <p className="mt-1 text-sm text-slate-400">{log.details}</p>
              ) : null}
              {log.user ? (
                <p className="mt-1 text-xs text-slate-500">
                  By {log.user.name ?? log.user.email} ({log.user.role})
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
