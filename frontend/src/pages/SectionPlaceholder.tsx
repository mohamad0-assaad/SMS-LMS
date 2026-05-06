import { useLocation, useParams } from 'react-router-dom'
import type { AppRole } from '../types/role'

export function SectionPlaceholder() {
  const { role } = useParams()
  const location = useLocation()
  const title = location.pathname.split('/').pop()?.replace(/-/g, ' ') ?? 'Section'

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/[0.08] bg-[#111111] p-8 text-center shadow-lg">
      <h2 className="text-lg font-semibold capitalize text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {role === 'student' || role === 'parent' ? (
          <>
            This screen is not wired yet. Use the sidebar links (timetable, exams, resources, AI
            coach) or quick actions on your dashboard.
          </>
        ) : (
          <>
            This screen is not wired yet. As an <span className="font-medium text-slate-300">admin</span>{' '}
            or <span className="font-medium text-slate-300">teacher</span>, try{' '}
            <strong>Users</strong>, <strong>Classes</strong>, or (admin) <strong>Activity logs</strong>{' '}
            in the sidebar for live API data.
          </>
        )}
      </p>
      <p className="mt-3 text-xs text-slate-400">
        Role: <span className="font-medium text-slate-400">{role as AppRole}</span>
      </p>
    </div>
  )
}
