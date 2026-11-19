export type Theme = 'dark' | 'light'
const KEY = 'farmverse.theme'

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage unavailable: the choice just is not remembered */
  }
}
