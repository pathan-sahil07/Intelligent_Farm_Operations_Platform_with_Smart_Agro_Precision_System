import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'
import { hierarchyService, type CurrentUser, type FarmRole } from '../features/user-management/services/hierarchyService'

interface RoleRouteProps {
  allowedRoles: FarmRole[]
  children: ReactNode
  allowMissingOrganization?: boolean
}

export function RoleRoute({ allowedRoles, children, allowMissingOrganization = false }: RoleRouteProps) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    hierarchyService.getCurrentUser()
      .then(setUser)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to verify role permissions.'))
  }, [])

  if (error) return <p role="alert">{error}</p>
  if (!user) return <p aria-busy="true">Checking role permissions…</p>
  if (!allowMissingOrganization && user.role === 'FARM_OWNER' && !user.organizationId) {
    return <Navigate replace to={APP_ROUTES.organizationSetup} />
  }
  if (!allowedRoles.includes(user.role)) return <Navigate replace to={APP_ROUTES.dashboard} />
  return children
}
