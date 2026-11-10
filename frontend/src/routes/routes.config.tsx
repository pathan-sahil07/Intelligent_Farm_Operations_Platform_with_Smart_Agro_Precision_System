import type { ReactNode } from 'react'
import type { FarmRole } from '../features/user-management/services/hierarchyService'

export interface AppRoute {
  path: string
  element: ReactNode
  roles: FarmRole[]
}