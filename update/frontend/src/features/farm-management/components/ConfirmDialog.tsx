import type { ReactNode } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  busy?: boolean
  error?: string
  onConfirm: () => void
  onClose: () => void
}

/** Confirmation for actions that cannot be undone. The confirm button is the destructive one. */
export function ConfirmDialog({ open, title, children, confirmLabel, busy = false, error, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal onClose={onClose} open={open} title={title}>
      <div className="confirm-body">{children}</div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button disabled={busy} onClick={onClose} variant="secondary">
          Keep it
        </Button>
        <Button disabled={busy} onClick={onConfirm} variant="danger">
          {busy ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
