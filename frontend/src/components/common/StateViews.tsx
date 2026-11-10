import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { errorMessage } from '@/lib/axios'

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 p-10 text-neutral-500">
      <Loader2 className="animate-spin" size={18} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-10 text-center">
      <Inbox className="text-neutral-400" size={32} aria-hidden="true" />
      <p className="font-semibold text-neutral-800">{title}</p>
      {description && <p className="max-w-md text-sm text-neutral-500">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 p-10 text-center">
      <AlertTriangle className="text-red-600" size={32} aria-hidden="true" />
      <p className="font-semibold text-neutral-800">Something went wrong</p>
      <p className="max-w-md text-sm text-neutral-600">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/** Shown on module pages when the user has no accessible farm to work on. */
export function NoFarm() {
  return (
    <EmptyState
      title="No farm selected"
      description="Create a farm under Farm management, or ask a farm owner to assign you to one, then pick it from the farm selector."
    />
  )
}
