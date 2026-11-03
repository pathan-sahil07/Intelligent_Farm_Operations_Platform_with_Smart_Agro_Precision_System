import type { ReactNode } from 'react'
import { SessionContext } from './session.context'

export type Role = 'admin' | 'farmer' | 'worker'
export interface Session {
  role: Role
  userId: number
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return <SessionContext.Provider value={{ session: { role: 'farmer', userId: 1 } }}>{children}</SessionContext.Provider>
}
