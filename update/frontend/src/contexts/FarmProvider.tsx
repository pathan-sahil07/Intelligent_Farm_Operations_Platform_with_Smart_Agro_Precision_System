import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/axios'
import type { FarmRef } from '@/api/types'
import { FARM_STORAGE_KEY } from '@/config/env'
import { useAuth } from './useAuth'
import { FarmContext, type FarmState } from './farm.context'

function readStored(): number | undefined {
  try {
    const raw = localStorage.getItem(FARM_STORAGE_KEY)
    return raw ? Number(raw) : undefined
  } catch {
    return undefined
  }
}

/** The farm every module page works on. Only farms the API returns (i.e. the user can access) are offered. */
export function FarmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['farms'], queryFn: () => get<FarmRef[]>('/farms'), enabled: !!user })
  const [stored, setStored] = useState<number | undefined>(readStored)

  const setFarmId = useCallback((id: number) => {
    setStored(id)
    try {
      localStorage.setItem(FARM_STORAGE_KEY, String(id))
    } catch {
      /* storage unavailable: selection just is not remembered */
    }
  }, [])

  const value = useMemo<FarmState>(() => {
    const farms = data ?? []
    const farm = farms.find((f) => f.id === stored) ?? farms[0]
    return { farms, loading: isLoading, farmId: farm?.id, farm, setFarmId }
  }, [data, isLoading, stored, setFarmId])

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}
