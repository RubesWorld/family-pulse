'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  THEME_STORAGE_KEY,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from '@/lib/theme-script'

interface ThemeContextValue {
  /** What the user chose — may be 'system'. */
  preference: ThemePreference
  /** What is actually applied right now. */
  theme: Theme
  setPreference: (pref: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'night'
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'day' || stored === 'night' || stored === 'system') {
      return stored
    }
  } catch {
    // Safari in private mode throws on localStorage access.
  }
  return 'night'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start on the SSR default. The inline head script has already painted
  // the correct theme; this syncs React's view of it after mount, which
  // keeps the server and client markup identical.
  const [preference, setPreferenceState] = useState<ThemePreference>('night')
  const [theme, setTheme] = useState<Theme>('night')

  useEffect(() => {
    const stored = readStoredPreference()
    setPreferenceState(stored)
    setTheme(resolveTheme(stored))
  }, [])

  // Only follow the OS while the user has explicitly asked us to.
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setTheme(mq.matches ? 'day' : 'night')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref)
    setTheme(resolveTheme(pref))
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref)
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, theme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
