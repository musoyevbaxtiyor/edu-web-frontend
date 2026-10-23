import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { WifiOff, RotateCcw, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getToken } from '../../lib/api'
import { PageLoader } from '../ui/Spinner'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'

// Token bor, lekin /auth/me tarmoq / server xatosi bilan o'tmadi — chiqarib yubormasdan qayta urinamiz
function AuthRetry() {
  const { authError, refreshUser, logout } = useAuth()
  const [busy, setBusy] = useState(false)

  const retry = async () => {
    setBusy(true)
    try {
      await refreshUser()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center" style={{ minHeight: '60vh', padding: 16 }}>
      <EmptyState
        icon={WifiOff}
        title="Serverga ulanib bo'lmadi"
        message={authError || "Server javob bermadi. Birozdan so'ng qayta urinib ko'ring."}
        action={
          <div className="row gap-2 wrap" style={{ justifyContent: 'center' }}>
            <Button onClick={retry} loading={busy}><RotateCcw /> Qayta urinish</Button>
            <Button variant="ghost" onClick={logout} disabled={busy}><LogOut /> Chiqish</Button>
          </div>
        }
      />
    </div>
  )
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, authError } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!isAuthenticated && authError && getToken()) return <AuthRetry />
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
