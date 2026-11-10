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
    return <AuthLoadingScreen />
  }

  if (status === 'error') {
    return <Navigate to={APP_ROUTES.signup} replace state={{ from: location }} />
  }

  if (status === 'unauthenticated') {
    const destination = location.pathname === APP_ROUTES.dashboard
      ? APP_ROUTES.signup
      : APP_ROUTES.login
    return (
      <Navigate
        to={destination}
        replace
        state={destination === APP_ROUTES.login ? { from: location } : undefined}
      />
    )
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
