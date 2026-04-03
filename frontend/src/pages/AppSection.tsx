import { useLocation, useParams } from 'react-router-dom'
import { isAppRole } from '../types/role'
import { ActivityLogsPage } from './data/ActivityLogsPage'
import { ClassesListPage } from './data/ClassesListPage'
import { UsersListPage } from './data/UsersListPage'
import { SectionPlaceholder } from './SectionPlaceholder'

function firstSegment(role: string, pathname: string): string {
  const prefix = `/app/${role}/`
  if (!pathname.startsWith(prefix)) return ''
  const rest = pathname.slice(prefix.length).replace(/\/$/, '')
  return rest.split('/')[0] ?? ''
}

export function AppSection() {
  const { role: roleParam } = useParams()
  const { pathname } = useLocation()

  if (!isAppRole(roleParam)) {
    return <SectionPlaceholder />
  }

  const role = roleParam
  const seg = firstSegment(role, pathname)

  if (role === 'admin') {
    if (seg === 'users') return <UsersListPage title="Users" />
    if (seg === 'classes') return <ClassesListPage />
    if (seg === 'logs') return <ActivityLogsPage />
  }

  if (role === 'teacher') {
    if (seg === 'students') return <UsersListPage title="Students" filterRole="student" />
    if (seg === 'classes') return <ClassesListPage />
  }

  return <SectionPlaceholder />
}
