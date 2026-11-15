import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { ModalProps } from './Modal.types'

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <section
        aria-describedby={description ? 'modal-description' : undefined}
        aria-labelledby="modal-title"
        aria-modal="true"
        className="modal-panel"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <h2 className="modal-title" id="modal-title">
              {title}
            </h2>
            {description && (
              <p className="modal-description" id="modal-description">
                {description}
              </p>
            )}
          </div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={16} />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}
