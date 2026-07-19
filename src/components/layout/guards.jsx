import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../ui/Spinner'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

export function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}
