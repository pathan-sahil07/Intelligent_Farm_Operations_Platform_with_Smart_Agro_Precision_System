import { useState } from 'react'

export interface Notice {
  message: string
  tone?: 'success' | 'error'
}

export function useNotice(initial = '') {
  const [notice, setNotice] = useState<Notice | null>(initial ? { message: initial } : null)
  return {
    notice,
    show: (message: string, tone: Notice['tone'] = 'success') => setNotice({ message, tone }),
    dismiss: () => setNotice(null),
  }
}
