import { useEffect, useState } from 'react'
import { apiFetch, getJson, postJson } from '../../lib/api'
import { Plus, Trash2, TrendingDown } from 'lucide-react'

type Expense = { _id: string; title: string; category: string; amount: number; date: string; description?: string; createdBy?: { name: string } }

const CATEGORIES = ['Utilities', 'Maintenance', 'Supplies', 'Events', 'Salaries', 'IT', 'Other']

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Other', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getJson<{ expenses: Expense[] }>('/api/expenses')
      .then((d) => setExpenses(d.expenses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function create(e: { preventDefault(): void }) {
    e.preventDefault(); setSaving(true); setErr(null)
    try {
      await postJson('/api/expenses', { ...form, amount: Number(form.amount) })
      setShowForm(false); setForm({ title: '', category: 'Other', amount: '', date: new Date().toISOString().slice(0, 10), description: '' }); load()
    } catch (ex: any) { setErr(ex.message) }
    finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!confirm('Delete this expense?')) return
    await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' })
    load()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Expenses</h1>
          <p className="text-sm text-slate-500">Total: <span className="text-rose-400 font-semibold">${total.toLocaleString()}</span></p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {err && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{err}</p>}

      {showForm && (
        <form onSubmit={create} className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">New Expense</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm"><span className="text-slate-400">Title</span>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block text-sm"><span className="text-slate-400">Category</span>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0d1a0d] px-3 py-2 text-sm text-white">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm"><span className="text-slate-400">Amount ($)</span>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block text-sm"><span className="text-slate-400">Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
          </div>
          <label className="block text-sm"><span className="text-slate-400">Description (optional)</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none resize-none focus:border-green-500/50" />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : !expenses.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-500"><TrendingDown className="h-10 w-10 opacity-30" /><p className="text-sm">No expenses recorded</p></div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-left text-xs text-slate-500"><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-slate-200">{e.title}</td>
                  <td className="px-4 py-3 text-slate-400"><span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs">{e.category}</span></td>
                  <td className="px-4 py-3 text-rose-400 font-semibold">${e.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(e._id)} className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
