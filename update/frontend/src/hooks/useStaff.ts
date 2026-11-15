import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/axios'
import { useFarm } from '@/contexts/useFarm'

interface WorkerRow {
  userId: number
  name?: string | null
}

/** People who can be given work on the selected farm: its owner and assigned staff. */
export function useStaff() {
  const { farmId, farm } = useFarm()
  const { data } = useQuery({
    queryKey: ['staff', farmId],
    queryFn: () => get<WorkerRow[]>(`/farms/${farmId}/workers`),
    enabled: !!farmId,
  })
  const options = [
    ...(farm ? [{ value: String(farm.ownerId), label: `Owner (user #${farm.ownerId})` }] : []),
    ...(data ?? []).map((w) => ({ value: String(w.userId), label: w.name ? `${w.name} (user #${w.userId})` : `User #${w.userId}` })),
  ]
  const nameOf = (id: number | null | undefined) => (id == null ? '—' : (options.find((o) => o.value === String(id))?.label ?? `User #${id}`))
  return { options, nameOf }
}
