import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  School,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { AppRole } from '../../types/role'
import { ROLE_LABELS } from '../../types/role'

type NavLeaf = { label: string; icon: LucideIcon; to: string; end?: boolean }

function NavRow({ item, onNavigate }: { item: NavLeaf; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-slate-300 hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
    >
      <item.icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
      {item.label}
    </NavLink>
  )
}

type AppSidebarProps = {
  role: AppRole
  userName: string
  onLogout: () => void
}

export function AppSidebar({ role, userName, onLogout }: AppSidebarProps) {
  const [adminOpen, setAdminOpen] = useState(true)
  const [aiToolsOpen, setAiToolsOpen] = useState(false)

  const base = `/app/${role}`

  const studentNav: NavLeaf[] = [
    { label: 'Dashboard', icon: LayoutDashboard, to: base, end: true },
    { label: 'My Timetable', icon: Calendar, to: `${base}/timetable` },
    { label: 'My Exams', icon: ClipboardList, to: `${base}/exams` },
    { label: 'My Results', icon: BarChart3, to: `${base}/results` },
    { label: 'AI Study Coach', icon: Sparkles, to: `${base}/ai-coach` },
    { label: 'Resources', icon: BookOpen, to: `${base}/resources` },
  ]

  const teacherNav: NavLeaf[] = [
    { label: 'Dashboard', icon: LayoutDashboard, to: base, end: true },
    { label: 'My Classes', icon: School, to: `${base}/classes` },
    { label: 'Students', icon: Users, to: `${base}/students` },
    { label: 'Exams', icon: ClipboardList, to: `${base}/exams` },
    { label: 'Results', icon: BarChart3, to: `${base}/results` },
    { label: 'Resources', icon: BookOpen, to: `${base}/resources` },
  ]

  const parentNav: NavLeaf[] = [
    { label: 'Dashboard', icon: LayoutDashboard, to: base, end: true },
    { label: 'My Children', icon: Users, to: `${base}/children` },
    { label: 'Attendance', icon: Calendar, to: `${base}/attendance` },
    { label: 'Exams & Results', icon: FileText, to: `${base}/exams-results` },
    { label: 'Timetable', icon: Calendar, to: `${base}/timetable` },
    { label: 'AI Insights', icon: Sparkles, to: `${base}/ai` },
    { label: 'Teacher Messages', icon: MessageSquare, to: `${base}/messages` },
  ]

  const adminTop: NavLeaf[] = [
    { label: 'Dashboard', icon: LayoutDashboard, to: base, end: true },
    { label: 'AI Insights', icon: Bot, to: `${base}/ai-insights` },
    { label: 'System Settings', icon: Settings, to: `${base}/settings` },
  ]

  const adminPanel: NavLeaf[] = [
    { label: 'Users', icon: Users, to: `${base}/users` },
    { label: 'Classes', icon: School, to: `${base}/classes` },
    { label: 'Subjects', icon: BookOpen, to: `${base}/subjects` },
    { label: 'Exams', icon: ClipboardList, to: `${base}/exams` },
    { label: 'Timetable', icon: Calendar, to: `${base}/timetable` },
    { label: 'Academic Years', icon: GraduationCap, to: `${base}/years` },
    { label: 'Activity Logs', icon: Activity, to: `${base}/logs` },
  ]

  const aiToolLinks: NavLeaf[] = [
    { label: 'Exam generator', icon: Sparkles, to: `${base}/ai/exam` },
    { label: 'Class insights', icon: BarChart3, to: `${base}/ai/insights` },
  ]

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--color-skill-sidebar)] text-slate-100">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">SkillUp</p>
          <p className="text-xs font-medium text-slate-400">LMS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {role === 'student' &&
          studentNav.map((item) => <NavRow key={item.label} item={item} />)}

        {role === 'teacher' && (
          <>
            {teacherNav.map((item) => (
              <NavRow key={item.label} item={item} />
            ))}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setAiToolsOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Bot className="h-4 w-4" />
                  AI Tools
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition ${aiToolsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {aiToolsOpen ? (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                  {aiToolLinks.map((item) => (
                    <NavRow key={item.label} item={item} />
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}

        {role === 'parent' &&
          parentNav.map((item) => <NavRow key={item.label} item={item} />)}

        {role === 'admin' && (
          <>
            <NavRow item={adminTop[0]} />
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAdminOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                <span>Admin panel</span>
                {adminOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {adminOpen ? (
                <div className="mt-1 space-y-0.5">
                  {adminPanel.map((item) => (
                    <NavRow key={item.label} item={item} />
                  ))}
                </div>
              ) : null}
            </div>
            {adminTop.slice(1).map((item) => (
              <NavRow key={item.label} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-sm font-bold text-white">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-slate-400">{ROLE_LABELS[role]}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
