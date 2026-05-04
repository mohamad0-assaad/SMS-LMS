import { useEffect, useState } from 'react'
import { Banknote, GraduationCap, Users } from 'lucide-react'
import { getJson } from '../lib/api'

type Child = { _id: string; name: string; email: string; studentClass?: { _id: string; name: string } | null }
type Fee = { _id: string; amount: number; paidAmount: number; balance: number; status: string; dueDate: string; description?: string }

function statusBadge(status: string) {
  if (status === 'paid') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'partial') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

export function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [fees, setFees] = useState<Fee[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [loadingFees, setLoadingFees] = useState(false)

  useEffect(() => {
    getJson<{ children: Child[] }>('/api/users/my-children')
      .then((d) => setChildren(d.children ?? []))
      .catch(() => {})
      .finally(() => setLoadingChildren(false))
  }, [])

  useEffect(() => {
    const child = children[activeIdx]
    if (!child) { setFees([]); return }
    setLoadingFees(true)
    getJson<{ fees: Fee[] }>(`/api/fees?student=${child._id}`)
      .then((d) => setFees(d.fees ?? []))
      .catch(() => setFees([]))
      .finally(() => setLoadingFees(false))
  }, [children, activeIdx])

  if (loadingChildren) {
    return <p className="text-sm text-slate-500">Loading…</p>
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

  const active = children[activeIdx]
  const totalOwed = fees.reduce((s, f) => s + f.balance, 0)
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0)
  const unpaidCount = fees.filter((f) => f.status !== 'paid').length

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Child tabs */}
      <div className="flex flex-wrap gap-2">
        {children.map((c, i) => (
          <button key={c._id} type="button" onClick={() => setActiveIdx(i)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              i === activeIdx
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                : 'bg-white/[0.06] text-slate-400 ring-1 ring-white/[0.08] hover:bg-white/[0.10] hover:text-white'
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Child info */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 text-lg font-bold">
          {active.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{active.name}</p>
          <p className="text-xs text-slate-500">{active.email}</p>
          {active.studentClass && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-xs text-teal-400 border border-teal-500/20">
              <GraduationCap className="h-3 w-3" /> {active.studentClass.name}
            </span>
          )}
        </div>
      </div>

      {/* Fee summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4">
          <p className="text-xs text-slate-500">Total Paid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4">
          <p className="text-xs text-slate-500">Outstanding Balance</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">${totalOwed.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4">
          <p className="text-xs text-slate-500">Unpaid Fees</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{unpaidCount}</p>
        </div>
      </div>

      {/* Fee records */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <Banknote className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-white">Fee Records</h2>
        </div>
        {loadingFees ? (
          <p className="px-5 py-6 text-sm text-slate-500">Loading…</p>
        ) : !fees.length ? (
          <p className="px-5 py-6 text-sm text-slate-500">No fee records for {active.name}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs text-slate-500">
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Paid</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-300">{f.description || '—'}</td>
                  <td className="px-5 py-3 text-slate-200">${f.amount}</td>
                  <td className="px-5 py-3 text-emerald-400">${f.paidAmount}</td>
                  <td className="px-5 py-3 text-rose-400">${f.balance}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(f.dueDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(f.status)}`}>{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
