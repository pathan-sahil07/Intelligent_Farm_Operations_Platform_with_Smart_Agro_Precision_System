import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Permission } from '@/config/permissions'
import { useAuth } from '@/contexts/useAuth'
import { Loading } from '@/components/common/StateViews'

/** Sends signed-out visitors to /login and users without the permission to /access-denied. */
export function ProtectedRoute({ permission }: { permission?: Permission }) {
  const { user, loading, can } = useAuth()
  const location = useLocation()
  if (loading) return <Loading label="Checking your session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (permission && !can(permission)) return <Navigate to="/access-denied" replace />
  return <Outlet />
}

/** Login / register: signed-in users go straight to the dashboard. */
export function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Loading label="Checking your session…" />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
