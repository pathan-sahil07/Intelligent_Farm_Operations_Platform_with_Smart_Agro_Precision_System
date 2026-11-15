import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import type { Notice } from '../../../hooks/useNotice'

export function Toast({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  if (!notice) return null
  const Icon = notice.tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div className={`toast ${notice.tone === 'error' ? 'toast-error' : ''}`.trim()} role={notice.tone === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={15} />
      <span>{notice.message}</span>
      <button aria-label="Dismiss message" className="toast-close" onClick={onDismiss} type="button">
        <X aria-hidden="true" size={13} />
      </button>
    </div>
  )
}
