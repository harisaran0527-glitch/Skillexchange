import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { AdminAuthProvider, useAdminAuth } from './admin/context/AdminAuthContext'
import PrivateRoute from './components/ui/PrivateRoute'
import AdminPrivateRoute from './admin/AdminPrivateRoute'
import LoadingScreen from './components/feedback/LoadingScreen'


const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const BestStudents = lazy(() => import('./pages/BestStudents'))
const Matches = lazy(() => import('./pages/Matches'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Settings = lazy(() => import('./pages/Settings'))

// Admin Pages
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'))
const AdminStudents = lazy(() => import('./admin/pages/AdminStudents'))
const AdminSkills = lazy(() => import('./admin/pages/AdminSkills'))
const AdminCourses = lazy(() => import('./admin/pages/AdminCourses'))
const AdminRequests = lazy(() => import('./admin/pages/AdminRequests'))
const AdminReports = lazy(() => import('./admin/pages/AdminReports'))
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings'))

// New Student Pages
const CourseSearch = lazy(() => import('./pages/CourseSearch'))
const StudentProfileView = lazy(() => import('./pages/StudentProfileView'))
const Chat = lazy(() => import('./pages/Chat'))

function AdminEntryRoute() {
  const { token } = useAdminAuth()
  return token ? <AdminDashboard /> : <AdminLogin />
}

function StudentEntryRoute() {
  const { token } = useAuth()
  return token ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AdminAuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Main Entry Links */}
              <Route path="/admin" element={<AdminEntryRoute />} />
              <Route path="/student" element={<StudentEntryRoute />} />

              {/* Aliases & Redirects */}
              <Route path="/" element={<Navigate to="/student" replace />} />
              <Route path="/login" element={<Navigate to="/student" replace />} />
              <Route path="/admin/login" element={<Navigate to="/admin" replace />} />

              {/* Protected Student routes */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/search" element={<PrivateRoute><CourseSearch /></PrivateRoute>} />
              <Route path="/student/:id" element={<PrivateRoute><StudentProfileView /></PrivateRoute>} />
              <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
              <Route path="/chat/:id" element={<PrivateRoute><Chat /></PrivateRoute>} />
              <Route path="/register" element={<Register />} />
              <Route path="/best-students" element={<BestStudents />} />

              {/* Protected Admin routes */}
              <Route path="/admin/dashboard" element={<AdminPrivateRoute><AdminDashboard /></AdminPrivateRoute>} />
              <Route path="/admin/students" element={<AdminPrivateRoute><AdminStudents /></AdminPrivateRoute>} />
              <Route path="/admin/skills" element={<AdminPrivateRoute><AdminSkills /></AdminPrivateRoute>} />
              <Route path="/admin/courses" element={<AdminPrivateRoute><AdminCourses /></AdminPrivateRoute>} />
              <Route path="/admin/requests" element={<AdminPrivateRoute><AdminRequests /></AdminPrivateRoute>} />
              <Route path="/admin/reports" element={<AdminPrivateRoute><AdminReports /></AdminPrivateRoute>} />
              <Route path="/admin/settings" element={<AdminPrivateRoute><AdminSettings /></AdminPrivateRoute>} />

              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
          </Suspense>
        </AdminAuthProvider>
      </SocketProvider>
    </AuthProvider>
  )
}

