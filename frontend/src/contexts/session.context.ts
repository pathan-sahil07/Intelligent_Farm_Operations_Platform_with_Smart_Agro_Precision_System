import { createContext } from 'react'
import type { SessionRole } from '@/config/permissions'

export type Role = SessionRole
export interface Session {
  role: Role
  userId: number
}

export const SessionContext = createContext<{ session: Session }>({
  session: { role: 'worker', userId: 0 },
})
