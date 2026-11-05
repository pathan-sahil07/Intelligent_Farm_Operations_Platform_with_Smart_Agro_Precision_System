import { createContext } from 'react'
import type { Session } from './SessionContext'

export const SessionContext = createContext<{ session: Session }>({
  session: { role: 'farmer', userId: 1 },
})
