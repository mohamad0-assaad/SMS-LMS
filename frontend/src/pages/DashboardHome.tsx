import { useParams } from 'react-router-dom'
import { isAppRole } from '../types/role'
import { AdminDashboard } from './AdminDashboard'
import { ParentDashboard } from './ParentDashboard'
import { StudentDashboard } from './StudentDashboard'
import { TeacherDashboard } from './TeacherDashboard'

export function DashboardHome() {
  const { role } = useParams()

  if (!isAppRole(role)) {
    return null
  }

  switch (role) {
    case 'student':
      return <StudentDashboard />
    case 'teacher':
      return <TeacherDashboard />
    case 'admin':
      return <AdminDashboard />
    case 'parent':
      return <ParentDashboard />
    default:
      return null
  }
}
