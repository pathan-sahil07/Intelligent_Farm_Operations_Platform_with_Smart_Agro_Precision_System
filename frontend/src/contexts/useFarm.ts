import { useContext } from 'react'
import { FarmContext } from './farm.context'

export function useFarm() {
  return useContext(FarmContext)
}
