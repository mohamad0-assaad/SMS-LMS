import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJson } from '../../lib/api'
import { Mail, School, Sparkles, Users } from 'lucide-react'

type ClassInfo = { _id: string; name: string; students?: string[] }
type StudentRow = { _id: string; name: string; email: string; isActive?: boolean }

const AVATAR_COLORS = ['bg-green-800', 'bg-emerald-800', 'bg-green-700', 'bg-emerald-700', 'bg-green-900']
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }
function initials(name: string) { return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() }

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111] p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-full bg-white/[0.06]" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
      </div>
      <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
      <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
      <div className="h-5 w-1/3 rounded-full bg-white/[0.06]" />
    </div>
  )
}

export function TeacherStudentsPage() {
  const { role } = useParams()
  const base = role ? `/app/${role}` : ''
  const [students, setStudents] = useState<StudentRow[]>([])
  const [classMap, setClassMap] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getJson<{ classes: ClassInfo[] }>('/api/classes?page=1&limit=100')
      .then(async (d) => {
        if (cancelled) return
        const clsList = d.classes ?? []

        const map = new Map<string, string>()
        const enrolledIds = new Set<string>()
        for (const cls of clsList) {
          for (const sid of cls.students ?? []) {
            map.set(String(sid), cls.name)
            enrolledIds.add(String(sid))
          }
        }
        setClassMap(map)

        if (!enrolledIds.size) {
          setLoading(false)
          return
        }

        const ud = await getJson<{ users: StudentRow[] }>('/api/users?role=student&limit=500')
        if (cancelled) return
        const inMyClasses = (ud.users ?? []).filter((u) => enrolledIds.has(String(u._id)))
        setStudents(inMyClasses)
        setLoading(false)
      })
      .catch((e: Error) => {
        if (!cancelled) { setErr(e.message); setLoading(false) }
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">My Students</h1>
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${students.length} students enrolled in your classes`}
        </p>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !students.length ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-center">
          <Users className="h-10 w-10 text-green-800/50" />
          <p className="text-slate-400">No students enrolled in your classes yet.</p>
          <p className="text-xs text-slate-600">Contact your administrator to assign students to your classes.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((u) => {
            const cls = classMap.get(String(u._id))
            return (
              <div
                key={u._id}
                className="relative rounded-2xl border border-white/[0.07] bg-[#111111] p-4 transition-all hover:border-green-500/20 hover:bg-[#141414] hover:shadow-md hover:shadow-black/40"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(u.name)}`}>
                    {initials(u.name)}
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${u.isActive === false ? 'bg-amber-500' : 'bg-green-500'}`}
                    title={u.isActive === false ? 'Inactive' : 'Active'}
                  />
                </div>
                <p className="font-semibold leading-tight text-white">{u.name}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                  <Mail className="h-3 w-3 shrink-0" /> {u.email}
                </p>
                {cls && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <School className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-400">{cls}</span>
                  </div>
                )}
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full border border-green-700/30 bg-green-900/40 px-2.5 py-0.5 text-xs font-medium text-green-400">
                    Student
                  </span>
                </div>
                <Link
                  to={`${base}/students/${u._id}/skill`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-green-700/30 bg-green-900/20 px-3 py-2 text-xs font-semibold text-green-400 transition-colors hover:bg-green-900/40 hover:text-green-300"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Predict Learning Outcome
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-600">
        Showing {students.length} students from your assigned classes only.
      </p>
    </div>
  )
}
