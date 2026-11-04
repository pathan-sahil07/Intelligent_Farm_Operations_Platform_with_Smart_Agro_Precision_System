import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'
import { useAuthStore } from '../store/useAuthStore'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'

interface PublicRouteProps {
  children?: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { status, checkSession } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (status === 'loading') {
    return <AuthLoadingScreen message="Loading workspace…" />
  }

  if (status === 'authenticated') {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || APP_ROUTES.dashboard
    return <Navigate to={from} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default PublicRoute
