import { useEffect, useMemo, useState } from 'react'
import { apiFetch, getJson, getProfile, postJson } from '../../lib/api'
import { AlertCircle, Briefcase, CheckCircle2, CreditCard, Loader2, Plus, Search, Trash2, X } from 'lucide-react'

type Salary = { _id: string; employeeName: string; role: string; amount: number; paymentDate: string; status: string; note?: string }
type UserOption = { _id: string; name: string; role: string }

function statusBadge(s: string) {
  if (s === 'Paid') return <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Paid</span>
  if (s === 'Processing') return <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">Processing</span>
  return <span className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-400">Pending</span>
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d1525] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SalaryPage() {
  const [role, setRole] = useState<string | null>(null)
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ employeeId: '', amount: '', paymentDate: new Date().toISOString().slice(0, 10), status: 'Pending', note: '' })
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getJson<{ salaries: Salary[] }>('/api/salary')
      .then((d) => setSalaries(d.salaries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getProfile().then((p) => {
      setRole(p?.role ?? null)
      if (p?.role === 'admin') {
        getJson<any>('/api/users?limit=200').then((d) =>
          setUsers((d.users ?? []).filter((u: any) => u.role !== 'student'))
        )
      }
    })
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return salaries
    const q = search.toLowerCase()
    return salaries.filter((r) =>
      r.employeeName.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  }, [salaries, search])

  const stats = useMemo(() => ({
    totalPayroll: salaries.reduce((s, r) => s + r.amount, 0),
    totalPaid: salaries.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.amount, 0),
    pendingCount: salaries.filter((r) => r.status === 'Pending').length,
    processingCount: salaries.filter((r) => r.status === 'Processing').length,
  }), [salaries])

  function resetForm() {
    setForm({ employeeId: '', amount: '', paymentDate: new Date().toISOString().slice(0, 10), status: 'Pending', note: '' })
  }

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault(); setSaving(true); setErr(null)
    try {
      await postJson('/api/salary', { ...form, amount: Number(form.amount) })
      setCreateOpen(false); resetForm(); setMsg('Salary record created'); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true); setErr(null)
    try {
      const res = await apiFetch(`/api/salary/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed') }
      setDeleteId(null); setMsg('Record deleted'); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setDeleting(false) }
  }

  const isTeacher = role === 'teacher'
  const inputCls = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50'
  const selectCls = 'w-full rounded-xl border border-white/[0.08] bg-[#0d1525] px-3 py-2 text-sm text-white outline-none'
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{isTeacher ? 'My Payments' : 'Salary'}</h1>
          <p className="text-sm text-slate-500">{isTeacher ? 'Your monthly salary payments from the school.' : 'Manage payroll records and payment status.'}</p>
        </div>
        {!isTeacher && (
          <button onClick={() => { setCreateOpen(true); setErr(null) }} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
            <Plus className="h-4 w-4" /> Add Salary Record
          </button>
        )}
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: isTeacher ? 'Total Earned' : 'Total Payroll', value: `$${stats.totalPayroll.toFixed(2)}`, icon: Briefcase, color: 'text-teal-400' },
          { label: isTeacher ? 'Total Received' : 'Total Paid', value: `$${stats.totalPaid.toFixed(2)}`, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pendingCount, icon: AlertCircle, color: 'text-amber-400' },
          { label: 'Processing', value: stats.processingCount, icon: CreditCard, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#111827] p-5">
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            </div>
            <Icon className={`h-8 w-8 opacity-70 ${color}`} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">{isTeacher ? 'Payment History' : 'Payroll Records'}</h2>
            <p className="text-xs text-slate-500">{isTeacher ? 'All salary payments issued to you.' : 'All salary payments and their statuses.'}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, role, or status…"
              className="w-56 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-teal-500/50 placeholder:text-slate-600" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs text-slate-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Note</th>
                {!isTeacher && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-500" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No salary records yet. Add a record to begin.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-slate-200">{s.employeeName}</td>
                  <td className="px-4 py-3 capitalize text-slate-400">{s.role}</td>
                  <td className="px-4 py-3 font-semibold text-teal-400">${s.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(s.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusBadge(s.status)}</td>
                  <td className="px-4 py-3 text-slate-500">{s.note || '—'}</td>
                  {!isTeacher && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setDeleteId(s._id); setErr(null) }} className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); resetForm() }} title="Add Salary Record">
        <form onSubmit={handleCreate} className="space-y-3">
          <div><label className={labelCls}>Employee</label>
            <select value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} required className={selectCls}>
              <option value="">Select teacher / staff</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Amount ($)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required placeholder="e.g. 2500" className={inputCls} />
            </div>
            <div><label className={labelCls}>Payment Date</label>
              <input type="date" value={form.paymentDate} onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))} required className={inputCls} />
            </div>
          </div>
          <div><label className={labelCls}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={selectCls}>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div><label className={labelCls}>Note <span className="text-slate-600">(optional)</span></label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. Bonus included" className={inputCls} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => { setCreateOpen(false); resetForm() }} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">{saving ? 'Saving…' : 'Save Record'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Record?">
        <p className="text-sm text-slate-400 py-2">This will permanently remove this salary record.</p>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  )
}
