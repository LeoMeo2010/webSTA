import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import ProfilePage from '@/pages/ProfilePage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminExercises from '@/pages/admin/AdminExercises'
import AdminExerciseForm from '@/pages/admin/AdminExerciseForm'
import AdminSubmissions from '@/pages/admin/AdminSubmissions'
import AdminGrade from '@/pages/admin/AdminGrade'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminInviteUser from '@/pages/admin/AdminInviteUser'
import StudentDashboard from '@/pages/student/StudentDashboard'
import StudentExercise from '@/pages/student/StudentExercise'
import StudentGrades from '@/pages/student/StudentGrades'
import Layout from '@/components/shared/Layout'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'student' }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-muted)' }}>Caricamento...</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/student" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="exercises" element={<AdminExercises />} />
          <Route path="exercises/new" element={<AdminExerciseForm />} />
          <Route path="exercises/:id/edit" element={<AdminExerciseForm />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="submissions/:id/grade" element={<AdminGrade />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/new" element={<AdminInviteUser />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Student routes */}
        <Route path="/student" element={<ProtectedRoute role="student"><Layout /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="exercises/:id" element={<StudentExercise />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
