export type AppRole = 'student' | 'teacher' | 'admin' | 'parent'

export function isAppRole(r: string | undefined): r is AppRole {
  return r === 'student' || r === 'teacher' || r === 'admin' || r === 'parent'
}

export const ROLE_LABELS: Record<AppRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Administrator',
  parent: 'Parent',
}
