import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'
import { useAuthStore } from '../store/useAuthStore'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'

interface PublicRouteProps {
  children?: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { status, isInitialized, checkSession } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (!isInitialized) {
      checkSession()
    }
  }, [checkSession, isInitialized])

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (status === 'authenticated') {
    const from = (location.state as { from?: { pathname: string; search?: string } })?.from
    return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : APP_ROUTES.dashboard} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default PublicRoute
