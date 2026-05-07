import { useEffect, useState } from 'react'
import { Banknote, GraduationCap, Users } from 'lucide-react'
import { getJson } from '../lib/api'
import { SkeletonCard } from '../components/ui/Skeleton'

type Child = { _id: string; name: string; email: string; studentClass?: { _id: string; name: string } | null }
type Fee = { _id: string; amount: number; paidAmount: number; balance: number; status: string; dueDate: string; description?: string }

function statusBadge(status: string) {
  if (status === 'paid') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'partial') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

function ChildFees({ child }: { child: Child }) {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    setLoading(true)
    getJson<{ fees: Fee[] }>(`/api/fees?student=${child._id}`)
      .then((d) => { if (!c) setFees(d.fees ?? []) })
      .catch(() => { if (!c) setFees([]) })
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [child._id])

  const totalOwed = fees.reduce((s, f) => s + f.balance, 0)
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0)
  const unpaidCount = fees.filter((f) => f.status !== 'paid').length

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden">
      {/* Child header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-sm font-bold text-white shadow-lg">
          {child.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate">{child.name}</p>
          <p className="text-xs text-slate-500 truncate">{child.email}</p>
        </div>
        {child.studentClass && (
          <span className="shrink-0 flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
            <GraduationCap className="h-3 w-3" />
            {child.studentClass.name}
          </span>
        )}
      </div>

      {/* Fee summary */}
      {loading ? (
        <div className="px-5 py-4 animate-pulse">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/[0.04]" />)}
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">Paid</p>
              <p className="text-base font-bold text-emerald-400">${totalPaid.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">Balance</p>
              <p className={`text-base font-bold ${totalOwed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>${totalOwed.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">Unpaid</p>
              <p className={`text-base font-bold ${unpaidCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{unpaidCount}</p>
            </div>
          </div>

          {fees.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Due</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f._id} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="px-4 py-2 text-slate-300">{f.description || '—'}</td>
                      <td className="px-4 py-2 text-slate-500">{new Date(f.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-lg border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(f.status)}`}>{f.status}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-rose-400">${f.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fees.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-2">No fee records.</p>
          )}
        </div>
      )}
    </div>
  )
}

export function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJson<{ children: Child[] }>('/api/users/my-children')
      .then((d) => setChildren(d.children ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="animate-pulse h-7 w-48 rounded-lg bg-white/[0.06]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
  }

  if (!children.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-slate-500">
        <Users className="h-12 w-12 opacity-20" />
        <p className="text-sm">No children linked to your account yet.</p>
        <p className="text-xs text-slate-600">Contact your school administrator to link your children.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500">
            {children.length} {children.length === 1 ? 'child' : 'children'} linked to your account
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-green-700/30 bg-green-900/20 px-3 py-1.5 text-xs font-semibold text-green-400">
          <Users className="h-3.5 w-3.5" />
          {children.length}
        </span>
      </div>

      {/* All children — one card each */}
      <div className={`grid gap-5 ${children.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {children.map((child) => (
          <ChildFees key={child._id} child={child} />
        ))}
      </div>

      {/* Finance overview footer */}
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-slate-500">
        <Banknote className="h-4 w-4 shrink-0 text-slate-600" />
        Use the sidebar links to view attendance, timetable, and exam results for each child.
      </div>
    </div>
  )
}
