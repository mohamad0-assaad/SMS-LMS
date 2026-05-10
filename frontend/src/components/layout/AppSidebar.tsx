import {
  BarChart3,
  Banknote,
  BookOpen,
  Bot,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { AppRole } from '../../types/role'
import { ROLE_LABELS } from '../../types/role'

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string
  path: string          // relative to base, e.g. '/classes'
  roles?: AppRole[]     // undefined = all roles
  exact?: boolean       // match only if path equals exactly
}

type NavGroup = {
  key: string
  label: string
  icon: LucideIcon
  roles?: AppRole[]     // hide entire group if role not in list
  items: NavItem[]
}

// ─── Nav data ─────────────────────────────────────────────────────────────────

const GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { label: 'Dashboard', path: '', exact: true },
      { label: 'Activity Logs', path: '/logs', roles: ['admin'] },
    ],
  },
  {
    key: 'academics',
    label: 'Academics',
    icon: School,
    items: [
      { label: 'Classes', path: '/classes', roles: ['admin', 'teacher'] },
      { label: 'Subjects', path: '/subjects', roles: ['admin', 'teacher'] },
      { label: 'Timetable', path: '/timetable', roles: ['admin', 'student', 'parent', 'teacher'] },
      { label: 'Attendance', path: '/attendance' },
    ],
  },
  {
    key: 'learning',
    label: 'Learning',
    icon: BookOpen,
    items: [
      { label: 'Exams', path: '/exams', roles: ['admin', 'teacher'] },
      { label: 'My Exams', path: '/exams', roles: ['student'] },
      { label: 'Exams & Results', path: '/exams-results', roles: ['parent'] },
      { label: 'Results', path: '/results', roles: ['teacher', 'student'] },
      { label: 'Assignments', path: '/assignments', roles: ['admin', 'teacher', 'student'] },
      { label: 'Materials', path: '/materials', roles: ['admin', 'teacher', 'student'] },
      { label: 'Resources', path: '/resources', roles: ['teacher', 'student'] },
      { label: 'AI Study Coach', path: '/ai-coach', roles: ['student'] },
    ],
  },
  {
    key: 'people',
    label: 'People',
    icon: Users,
    items: [
      { label: 'Users', path: '/users', roles: ['admin'] },
      { label: 'Students', path: '/students', roles: ['teacher'] },
      { label: 'My Children', path: '/children', roles: ['parent'] },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: Banknote,
    items: [
      { label: 'Fees', path: '/fees', roles: ['admin', 'teacher', 'student'] },
      { label: 'Expenses', path: '/expenses', roles: ['admin'] },
      { label: 'Salary', path: '/salary', roles: ['admin'] },
    ],
  },
  {
    key: 'reports',
    label: 'Reports & Insights',
    icon: BarChart3,
    items: [
      { label: 'Report Cards', path: '/report-cards', roles: ['admin', 'teacher', 'student'] },
      { label: 'AI Insights', path: '/ai-insights', roles: ['admin', 'teacher', 'parent'] },
      { label: 'Teacher Messages', path: '/messages', roles: ['parent'] },
      { label: 'Messages', path: '/messages', roles: ['teacher'] },
    ],
  },
  {
    key: 'ai',
    label: 'AI Tools',
    icon: Bot,
    roles: ['teacher'],
    items: [
      { label: 'Student Predictions', path: '/students', roles: ['teacher'] },
      { label: 'Exam Generator', path: '/ai/exam', roles: ['teacher'] },
      { label: 'Class Insights', path: '/ai/insights', roles: ['teacher'] },
    ],
  },
  {
    key: 'system',
    label: 'System',
    icon: Settings2,
    roles: ['admin'],
    items: [
      { label: 'Academic Years', path: '/years', roles: ['admin'] },
      { label: 'Settings', path: '/settings', roles: ['admin'] },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, base: string, item: NavItem): boolean {
  const full = base + item.path
  if (item.exact || item.path === '') return pathname === base || pathname === full
  return pathname === full || pathname.startsWith(full + '/')
}

// ─── NavRow ───────────────────────────────────────────────────────────────────

function NavRow({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <NavLink
      to={to}
      className={[
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-green-500/[0.12] text-white border-l-2 border-green-500 rounded-l-none pl-[10px]'
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
      ].join(' ')}
    >
      {label}
    </NavLink>
  )
}

// ─── Sidebar group ────────────────────────────────────────────────────────────

function SidebarGroup({
  group,
  base,
  role,
  pathname,
  open,
  onToggle,
}: {
  group: NavGroup
  base: string
  role: AppRole
  pathname: string
  open: boolean
  onToggle: () => void
}) {
  const visibleItems = group.items.filter(
    (item) => !item.roles || item.roles.includes(role),
  )
  if (visibleItems.length === 0) return null

  const Icon = group.icon
  const anyActive = visibleItems.some((item) => isActive(pathname, base, item))

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={[
          'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider transition-colors',
          anyActive
            ? 'text-green-400'
            : 'text-slate-500 hover:text-slate-300',
        ].join(' ')}
      >
        <span className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          {group.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-2 space-y-0.5 border-l border-white/[0.07] pl-3">
          {visibleItems.map((item) => (
            <NavRow
              key={item.label}
              to={base + item.path}
              label={item.label}
              active={isActive(pathname, base, item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

type AppSidebarProps = {
  role: AppRole
  userName: string
  onLogout: () => void
}

export function AppSidebar({ role, userName, onLogout }: AppSidebarProps) {
  const { pathname } = useLocation()
  const base = `/app/${role}`

  // Which groups have any active item → start open
  function initOpen(): Set<string> {
    const open = new Set<string>()
    for (const g of GROUPS) {
      const visible = g.items.filter((i) => !i.roles || i.roles.includes(role))
      if (visible.some((i) => isActive(pathname, base, i))) {
        open.add(g.key)
      }
    }
    // Always open 'overview' by default
    open.add('overview')
    return open
  }

  const [openGroups, setOpenGroups] = useState<Set<string>>(initOpen)

  function toggle(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Filter groups visible for this role
  const visibleGroups = GROUPS.filter((g) => {
    if (g.roles && !g.roles.includes(role)) return false
    return g.items.some((i) => !i.roles || i.roles.includes(role))
  })

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--color-skill-sidebar)] text-slate-100">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg shadow-green-900/40">
          <GraduationCap className="h-4.5 w-4.5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">SkillUp LMS</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {ROLE_LABELS[role]}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => (
          <SidebarGroup
            key={group.key}
            group={group}
            base={base}
            role={role}
            pathname={pathname}
            open={openGroups.has(group.key)}
            onToggle={() => toggle(group.key)}
          />
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/5 p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-sm font-bold text-white">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-slate-500">{ROLE_LABELS[role]}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 text-sm font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

