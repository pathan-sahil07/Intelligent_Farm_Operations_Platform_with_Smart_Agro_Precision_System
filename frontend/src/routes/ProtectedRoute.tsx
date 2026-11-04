import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'
import { useAuthStore } from '../store/useAuthStore'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'

interface ProtectedRouteProps {
  children?: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status, checkSession } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (status === 'loading') {
    return <AuthLoadingScreen message="Verifying secure session…" />
  }

  if (status === 'unauthenticated') {
    return <Navigate to={APP_ROUTES.login} replace state={{ from: location }} />
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
