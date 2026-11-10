import { Badge, type BadgeProps } from '@/components/ui/badge'

const TONES: Record<string, BadgeProps['variant']> = {
  Active: 'default', Completed: 'default', DONE: 'default', AVAILABLE: 'default', HEALTHY: 'default', IRRIGATE: 'default', READ: 'secondary',
  Scheduled: 'info', OPEN: 'info', IN_PROGRESS: 'info', IN_USE: 'info', DELAY: 'warning', STRESSED: 'warning', MAINTENANCE: 'warning', WARNING: 'warning',
  Skipped: 'secondary', CANCELLED: 'secondary', RETIRED: 'secondary', Harvested: 'secondary', SKIP: 'secondary',
  DISEASED: 'danger', PEST: 'danger', SEVERE: 'danger',
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant={TONES[value] ?? 'secondary'}>{value.replace(/_/g, ' ')}</Badge>
}
