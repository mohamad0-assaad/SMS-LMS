import { useLocation, useParams } from 'react-router-dom'
import { isAppRole } from '../types/role'
import { AcademicYearsPage } from './data/AcademicYearsPage'
import { ActivityLogsPage } from './data/ActivityLogsPage'
import { AdminSettingsPage } from './data/AdminSettingsPage'
import { AdminTimetablePage } from './data/AdminTimetablePage'
import { AiClassInsightsPage } from './data/AiClassInsightsPage'
import { AssignmentsPage } from './data/AssignmentsPage'
import { AttendancePage } from './data/AttendancePage'
import { ClassesListPage } from './data/ClassesListPage'
import { CreateClassPage } from './data/CreateClassPage'
import { ExpensesPage } from './data/ExpensesPage'
import { FeesPage } from './data/FeesPage'
import { MaterialsPage } from './data/MaterialsPage'
import { RegisterUserPage } from './data/RegisterUserPage'
import { ReportCardPage } from './data/ReportCardPage'
import { SalaryPage } from './data/SalaryPage'
import { StudentAiCoachPage } from './data/StudentAiCoachPage'
import { StudentExamTakePage } from './data/StudentExamTakePage'
import { StudentExamsPage } from './data/StudentExamsPage'
import { StudentResourcesPage } from './data/StudentResourcesPage'
import { StudentResultsPage } from './data/StudentResultsPage'
import { StudentSkillInsightPage } from './data/StudentSkillInsightPage'
import { StudentTimetablePage } from './data/StudentTimetablePage'
import { SubjectsListPage } from './data/SubjectsListPage'
import { TeacherAiExamPage } from './data/TeacherAiExamPage'
import { TeacherExamDetailPage } from './data/TeacherExamDetailPage'
import { TeacherExamsPage } from './data/TeacherExamsPage'
import { TeacherResourcesPage } from './data/TeacherResourcesPage'
import { TeacherResultsPage } from './data/TeacherResultsPage'
import { UsersListPage } from './data/UsersListPage'
import { SectionPlaceholder } from './SectionPlaceholder'

function segments(role: string, pathname: string): string[] {
  const prefix = `/app/${role}/`
  if (!pathname.startsWith(prefix)) return []
  const rest = pathname.slice(prefix.length).replace(/\/$/, '')
  if (!rest) return []
  return rest.split('/').filter(Boolean)
}

export function AppSection() {
  const { role: roleParam } = useParams()
  const { pathname } = useLocation()

  if (!isAppRole(roleParam)) {
    return <SectionPlaceholder />
  }

  const role = roleParam
  const seg = segments(role, pathname)
  const [a, b, c] = seg

  if (role === 'admin') {
    if (a === 'users' && b === 'register') return <RegisterUserPage />
    if (a === 'users') return <UsersListPage title="Users" />
    if (a === 'classes' && (b === 'new' || b === 'create')) return <CreateClassPage />
    if (a === 'classes') return <ClassesListPage />
    if (a === 'subjects') return <SubjectsListPage />
    if (a === 'years') return <AcademicYearsPage />
    if (a === 'settings') return <AdminSettingsPage />
    if (a === 'logs') return <ActivityLogsPage />
    if (a === 'timetable') return <AdminTimetablePage />
    if (a === 'attendance') return <AttendancePage />
    if (a === 'assignments') return <AssignmentsPage />
    if (a === 'materials') return <MaterialsPage />
    if (a === 'fees') return <FeesPage />
    if (a === 'expenses') return <ExpensesPage />
    if (a === 'salary') return <SalaryPage />
    if (a === 'report-cards') return <ReportCardPage />
    if (a === 'ai-insights') return <AiClassInsightsPage />
    if (a === 'ai' && b === 'insights') return <AiClassInsightsPage />
    if (a === 'exams' && b) return <TeacherExamDetailPage />
    if (a === 'exams') {
      return (
        <TeacherExamsPage
          title="All exams"
          description="Exams across the school (admin view)"
        />
      )
    }
  }

  if (role === 'teacher') {
    if (a === 'students' && b && c === 'skill') return <StudentSkillInsightPage />
    if (a === 'students') return <UsersListPage title="Students" filterRole="student" />
    if (a === 'classes') return <ClassesListPage />
    if (a === 'exams' && b) return <TeacherExamDetailPage />
    if (a === 'exams') return <TeacherExamsPage />
    if (a === 'results') return <TeacherResultsPage />
    if (a === 'resources') return <TeacherResourcesPage />
    if (a === 'attendance') return <AttendancePage />
    if (a === 'assignments') return <AssignmentsPage />
    if (a === 'materials') return <MaterialsPage />
    if (a === 'fees') return <FeesPage />
    if (a === 'report-cards') return <ReportCardPage />
    if (a === 'ai' && b === 'exam') return <TeacherAiExamPage />
    if (a === 'ai-insights') return <AiClassInsightsPage />
    if (a === 'ai' && b === 'insights') return <AiClassInsightsPage />
  }

  if (role === 'student') {
    if (a === 'timetable') return <StudentTimetablePage />
    if (a === 'exams' && b) return <StudentExamTakePage />
    if (a === 'exams') return <StudentExamsPage />
    if (a === 'results') return <StudentResultsPage />
    if (a === 'ai-coach') return <StudentAiCoachPage />
    if (a === 'resources') return <StudentResourcesPage />
    if (a === 'attendance') return <AttendancePage />
    if (a === 'assignments') return <AssignmentsPage />
    if (a === 'materials') return <MaterialsPage />
    if (a === 'fees') return <FeesPage />
    if (a === 'report-cards') return <ReportCardPage />
  }

  return <SectionPlaceholder />
}
