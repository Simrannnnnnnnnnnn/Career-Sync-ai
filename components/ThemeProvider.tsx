'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: 'dark', toggle: () => {} })

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem('cs-theme')
  return stored === 'dark' || stored === 'light' ? stored : null
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const storedTheme = getStoredTheme()
    const initialTheme = storedTheme ?? getSystemTheme()
    applyTheme(initialTheme)
    return initialTheme
  })

  useEffect(() => {
    const syncTheme = () => {
      const storedTheme = getStoredTheme()
      const initialTheme = storedTheme ?? getSystemTheme()
      setTheme(initialTheme)
      applyTheme(initialTheme)
    }

    syncTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      const storedTheme = getStoredTheme()
      if (!storedTheme) {
        const nextTheme = getSystemTheme()
        setTheme(nextTheme)
        applyTheme(nextTheme)
      }
    }

    mediaQuery.addEventListener?.('change', handleSystemThemeChange)
    window.addEventListener('storage', syncTheme)

    return () => {
      mediaQuery.removeEventListener?.('change', handleSystemThemeChange)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem('cs-theme', next)
      applyTheme(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)