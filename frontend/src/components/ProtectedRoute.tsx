/**
 * Protected Route Component
 * Redirects non-authenticated or non-admin users
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to home if admin access is required but user is not admin or staff
  if (requireAdmin && user.role !== 'admin' && user.role !== 'staff') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
