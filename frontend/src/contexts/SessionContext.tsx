import { createContext, useContext, type ReactNode } from 'react'

export type Role = 'admin' | 'farmer' | 'worker'
export interface Session {
  role: Role
  userId: number
}

const SessionContext = createContext<{ session: Session }>({
  session: { role: 'farmer', userId: 1 },
})

export function SessionProvider({ children }: { children: ReactNode }) {
  return <SessionContext.Provider value={{ session: { role: 'farmer', userId: 1 } }}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  farmer: 'Farmer',
  worker: 'Field worker',
}
