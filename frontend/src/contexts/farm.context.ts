import { createContext } from 'react'
import type { FarmRef } from '@/api/types'

export interface FarmState {
  farms: FarmRef[]
  loading: boolean
  farmId: number | undefined
  farm: FarmRef | undefined
  setFarmId: (id: number) => void
}

export const FarmContext = createContext<FarmState>({
  farms: [],
  loading: false,
  farmId: undefined,
  farm: undefined,
  setFarmId: () => undefined,
})
