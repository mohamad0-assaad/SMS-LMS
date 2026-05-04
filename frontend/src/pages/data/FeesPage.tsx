import { useEffect, useMemo, useState } from 'react'
import { apiFetch, getJson, getProfile, postJson } from '../../lib/api'
import { AlertCircle, CheckCircle2, Edit3, Plus, Search, TrendingUp, Users, Wallet, X } from 'lucide-react'

type Fee = { _id: string; amount: number; paidAmount: number; balance: number; status: string; dueDate: string; description?: string; student?: { name: string; email: string }; class?: { name: string } }
type StudentOption = { _id: string; name: string }
type ClassOption = { _id: string; name: string }

function statusBadge(status: string) {
  if (status === 'paid') return <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Paid</span>
  if (status === 'partial') return <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">Partial</span>
  return <span className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">Unpaid</span>
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

export function FeesPage() {
  const [role, setRole] = useState<string | null>(null)
  const [fees, setFees] = useState<Fee[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Create invoice form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ student: '', classId: '', amount: '', dueDate: '', description: '' })
  const [saving, setSaving] = useState(false)

  // Pay dialog
  const [payFee, setPayFee] = useState<Fee | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payRef, setPayRef] = useState('')
  const [paying, setPaying] = useState(false)

  // Status dialog
  const [statusFee, setStatusFee] = useState<Fee | null>(null)
  const [newStatus, setNewStatus] = useState('unpaid')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Bulk dialog
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulk, setBulk] = useState({ classId: '', amount: '', dueDate: '', description: '' })
  const [bulkSaving, setBulkSaving] = useState(false)

  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    getJson<{ fees: Fee[] }>(`/api/fees?${params}`)
      .then((d) => setFees(d.fees ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getProfile().then((p) => {
      setRole(p?.role ?? null)
      if (p && p.role !== 'student') {
        getJson<any>('/api/users?role=student&limit=200').then((d) => setStudents(d.users ?? [])).catch(() => {})
        getJson<any>('/api/classes').then((d) => setClasses(d.classes ?? [])).catch(() => {})
      }
    })
  }, [])

  useEffect(() => { load() }, [statusFilter])

  const filtered = useMemo(() => {
    if (!search) return fees
    const q = search.toLowerCase()
    return fees.filter((f) =>
      f.student?.name?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      f.class?.name?.toLowerCase().includes(q)
    )
  }, [fees, search])

  const stats = useMemo(() => ({
    totalInvoiced: fees.reduce((s, f) => s + f.amount, 0),
    totalCollected: fees.reduce((s, f) => s + f.paidAmount, 0),
    totalOutstanding: fees.reduce((s, f) => s + f.balance, 0),
    unpaidCount: fees.filter((f) => f.status === 'unpaid').length,
  }), [fees])

  async function createFee(e: { preventDefault(): void }) {
    e.preventDefault(); setSaving(true); setErr(null)
    try {
      await postJson('/api/fees', { student: form.student, class: form.classId || undefined, amount: Number(form.amount), dueDate: form.dueDate, description: form.description })
      setShowForm(false); setForm({ student: '', classId: '', amount: '', dueDate: '', description: '' })
      setMsg('Fee invoice created'); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setSaving(false) }
  }

  async function handlePay() {
    if (!payFee) return
    const amt = Number(payAmount)
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return }
    setPaying(true); setErr(null)
    try {
      const res = await apiFetch(`/api/fees/${payFee._id}/pay`, { method: 'PUT', body: JSON.stringify({ amount: amt, method: payMethod, reference: payRef }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || 'Failed')
      setPayFee(null); setMsg('Payment recorded'); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setPaying(false) }
  }

  async function handleUpdateStatus() {
    if (!statusFee) return
    setUpdatingStatus(true); setErr(null)
    try {
      const res = await apiFetch(`/api/fees/${statusFee._id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.message || 'Failed')
      setStatusFee(null); setMsg('Status updated'); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setUpdatingStatus(false) }
  }

  async function handleBulk(e: { preventDefault(): void }) {
    e.preventDefault(); setBulkSaving(true); setErr(null)
    try {
      await postJson('/api/fees/bulk', { classId: bulk.classId, amount: Number(bulk.amount), dueDate: bulk.dueDate, description: bulk.description })
      setBulkOpen(false); setBulk({ classId: '', amount: '', dueDate: '', description: '' })
      setMsg('Bulk invoices created for all students in class'); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setBulkSaving(false) }
  }

  const inputCls = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50'
  const selectCls = 'w-full rounded-xl border border-white/[0.08] bg-[#0d1525] px-3 py-2 text-sm text-white outline-none'
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{role === 'student' ? 'My Fee Overview' : 'Fee Collection'}</h1>
          <p className="text-sm text-slate-500">{role === 'student' ? 'See your outstanding balances and payment status.' : 'Create invoices, track payments, and collect fees.'}</p>
        </div>
        {role !== 'student' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setBulkOpen(true)} className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.04] hover:text-white">
              <Users className="h-4 w-4" /> Bulk Invoice
            </button>
            <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
              <Plus className="h-4 w-4" /> Create Invoice
            </button>
          </div>
        )}
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{msg}</p>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Invoiced', value: `$${stats.totalInvoiced.toFixed(2)}`, icon: Wallet, color: 'text-teal-400' },
          { label: 'Total Collected', value: `$${stats.totalCollected.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Outstanding', value: `$${stats.totalOutstanding.toFixed(2)}`, icon: AlertCircle, color: 'text-rose-400' },
          { label: 'Unpaid Invoices', value: stats.unpaidCount, icon: CheckCircle2, color: 'text-amber-400' },
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

      {/* Create Invoice form */}
      {showForm && role !== 'student' && (
        <form onSubmit={createFee} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Create Invoice</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            <div><label className={labelCls}>Student</label>
              <select value={form.student} onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))} required className={selectCls}>
                <option value="">Select student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Class (optional)</label>
              <select value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className={selectCls}>
                <option value="">Auto from student</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Amount ($)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required placeholder="e.g. 1200" className={inputCls} />
            </div>
            <div><label className={labelCls}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div><label className={labelCls}>Description (optional)</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Term fee, exam fee" className={inputCls} />
            </div>
            <div className="flex items-end justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">{saving ? 'Saving…' : 'Create Invoice'}</button>
            </div>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Fee Records</h2>
            <p className="text-xs text-slate-500">Review unpaid, partial, and paid invoices.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or description" className="w-52 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-teal-500/50 placeholder:text-slate-600" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d1525] px-3 py-2 text-sm text-white outline-none">
              <option value="all">All statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs text-slate-500">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                {role !== 'student' && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No fee records found.</td></tr>
              ) : filtered.map((f) => (
                <tr key={f._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{f.student?.name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{f.student?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{f.class?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(f.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-200">${f.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-400">${f.paidAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-rose-400">${f.balance.toFixed(2)}</td>
                  <td className="px-4 py-3">{statusBadge(f.status)}</td>
                  {role !== 'student' && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button disabled={f.status === 'paid'} onClick={() => { setPayFee(f); setPayAmount(String(f.balance || f.amount)); setPayMethod('cash'); setPayRef(''); setErr(null) }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-teal-500/10 hover:text-teal-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Record Payment">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        {role === 'admin' && (
                          <button onClick={() => { setStatusFee(f); setNewStatus(f.status); setErr(null) }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-violet-500/10 hover:text-violet-400" title="Update Status">
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Dialog */}
      <Modal open={!!payFee} onClose={() => setPayFee(null)} title="Record Payment">
        <p className="mb-4 text-sm text-slate-400">
          Student: <span className="font-medium text-white">{payFee?.student?.name}</span>
          {' · '}Balance: <span className="font-medium text-white">${payFee?.balance.toFixed(2)}</span>
        </p>
        <div className="space-y-3">
          <div><label className={labelCls}>Amount</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={inputCls} />
          </div>
          <div><label className={labelCls}>Method</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={selectCls}>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div><label className={labelCls}>Reference <span className="text-slate-600">(optional)</span></label>
            <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. receipt #123" className={inputCls} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setPayFee(null)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={handlePay} disabled={paying} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">{paying ? 'Saving…' : 'Record Payment'}</button>
        </div>
      </Modal>

      {/* Status Dialog */}
      <Modal open={!!statusFee} onClose={() => setStatusFee(null)} title="Update Fee Status">
        <p className="mb-4 text-sm text-slate-400">Student: <span className="font-medium text-white">{statusFee?.student?.name}</span></p>
        <div><label className={labelCls}>Status</label>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={selectCls}>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setStatusFee(null)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={handleUpdateStatus} disabled={updatingStatus} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{updatingStatus ? 'Saving…' : 'Update Status'}</button>
        </div>
      </Modal>

      {/* Bulk Invoice Dialog */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Invoice">
        <p className="mb-4 text-sm text-slate-400">Creates one invoice for every student in the selected class.</p>
        <form onSubmit={handleBulk} className="space-y-3">
          <div><label className={labelCls}>Class</label>
            <select value={bulk.classId} onChange={(e) => setBulk((b) => ({ ...b, classId: e.target.value }))} required className={selectCls}>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Amount ($)</label>
              <input type="number" value={bulk.amount} onChange={(e) => setBulk((b) => ({ ...b, amount: e.target.value }))} required placeholder="e.g. 1200" className={inputCls} />
            </div>
            <div><label className={labelCls}>Due Date</label>
              <input type="date" value={bulk.dueDate} onChange={(e) => setBulk((b) => ({ ...b, dueDate: e.target.value }))} required className={inputCls} />
            </div>
          </div>
          <div><label className={labelCls}>Description <span className="text-slate-600">(optional)</span></label>
            <input value={bulk.description} onChange={(e) => setBulk((b) => ({ ...b, description: e.target.value }))} placeholder="e.g. Term 1 tuition fee" className={inputCls} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setBulkOpen(false)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={bulkSaving} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">
              <Users className="h-4 w-4" />{bulkSaving ? 'Creating…' : 'Create for All Students'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
