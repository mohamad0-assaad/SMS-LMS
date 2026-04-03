import { useLocation, useParams } from 'react-router-dom'
import type { AppRole } from '../types/role'

export function SectionPlaceholder() {
  const { role } = useParams()
  const location = useLocation()
  const title = location.pathname.split('/').pop()?.replace(/-/g, ' ') ?? 'Section'

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-semibold capitalize text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        This screen is not wired yet. As an <span className="font-medium text-slate-700">admin</span>{' '}
        or <span className="font-medium text-slate-700">teacher</span>, try{' '}
        <strong>Users</strong>, <strong>Classes</strong>, or (admin) <strong>Activity logs</strong> in
        the sidebar for live API data.
      </p>
      <p className="mt-3 text-xs text-slate-400">
        Role: <span className="font-medium text-slate-600">{role as AppRole}</span>
      </p>
    </div>
  )
}
