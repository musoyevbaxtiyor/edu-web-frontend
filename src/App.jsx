import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, RoleRoute, PublicOnly } from './components/layout/guards'
import AppShell from './components/layout/AppShell'
import { PageLoader } from './components/ui/Spinner'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const MyCourses = lazy(() => import('./pages/MyCourses'))
const LessonView = lazy(() => import('./pages/LessonView'))
const Tests = lazy(() => import('./pages/Tests'))
const Exams = lazy(() => import('./pages/Exams'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const CourseManager = lazy(() => import('./pages/teacher/CourseManager'))
const LessonManager = lazy(() => import('./pages/teacher/LessonManager'))
const Submissions = lazy(() => import('./pages/teacher/Submissions'))
const TestManager = lazy(() => import('./pages/teacher/TestManager'))
const ExamManager = lazy(() => import('./pages/teacher/ExamManager'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const Analytics = lazy(() => import('./pages/admin/Analytics'))
const NotFound = lazy(() => import('./pages/NotFound'))

const T = ['teacher', 'admin']

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Ochiq sahifalar */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

        {/* Himoyalangan (AppShell ichida) */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/learn/:courseId" element={<LessonView />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />

          {/* O'qituvchi / admin */}
          <Route path="/teach/courses" element={<RoleRoute roles={T}><CourseManager /></RoleRoute>} />
          <Route path="/teach/courses/:courseId/lessons" element={<RoleRoute roles={T}><LessonManager /></RoleRoute>} />
          <Route path="/teach/submissions" element={<RoleRoute roles={T}><Submissions /></RoleRoute>} />
          <Route path="/teach/tests" element={<RoleRoute roles={T}><TestManager /></RoleRoute>} />
          <Route path="/teach/exams" element={<RoleRoute roles={T}><ExamManager /></RoleRoute>} />

          {/* Admin */}
          <Route path="/admin/users" element={<RoleRoute roles={['admin']}><AdminUsers /></RoleRoute>} />
          <Route path="/admin/courses" element={<RoleRoute roles={['admin']}><AdminCourses /></RoleRoute>} />
          <Route path="/admin/analytics" element={<RoleRoute roles={['admin']}><Analytics /></RoleRoute>} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}
