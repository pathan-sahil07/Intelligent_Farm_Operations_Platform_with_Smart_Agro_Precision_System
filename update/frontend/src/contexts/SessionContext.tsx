import { useMemo, type ReactNode } from 'react'
import { toSessionRole } from '@/config/permissions'
import { useAuth } from './useAuth'
import { SessionContext } from './session.context'

export type { Role, Session } from './session.context'

/** Exposes the signed-in user to the farm-management screens as { role, userId }. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const value = useMemo(
    () => ({ session: { role: toSessionRole(user?.role), userId: user?.id ?? 0 } }),
    [user],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
