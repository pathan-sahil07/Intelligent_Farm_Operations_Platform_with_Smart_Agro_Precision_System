import type { ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}
