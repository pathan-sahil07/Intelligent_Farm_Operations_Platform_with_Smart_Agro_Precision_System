import type { ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  size?: string
  onClose: () => void
  children: ReactNode
}
