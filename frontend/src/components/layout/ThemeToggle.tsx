import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, currentTheme, type Theme } from '@/lib/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => { applyTheme(next); setTheme(next) }}
    >
      {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  )
}
