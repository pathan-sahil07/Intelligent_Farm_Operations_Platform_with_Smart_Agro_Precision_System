import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FarmDetailPage } from '@/features/farm-management/components/FarmDetailPage'
import { useFarm } from '@/contexts/useFarm'

/** Opening a farm makes it the farm every other page works on. */
export default function FarmDetailRoute() {
  const { farmId } = useParams()
  const { farms, setFarmId } = useFarm()
  useEffect(() => {
    const id = Number(farmId)
    if (id && farms.some((f) => f.id === id)) setFarmId(id)
  }, [farmId, farms, setFarmId])
  return <FarmDetailPage />
}
