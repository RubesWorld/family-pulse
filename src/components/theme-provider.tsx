'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {
  THEME_STORAGE_KEY,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from '@/lib/theme-script'
import { THEME_TOKENS, withAlpha } from '@/lib/theme-tokens'
import type { PersonAccent } from '@/lib/person-color'

interface ThemeContextValue {
  /** What the user chose — may be 'system'. */
  preference: ThemePreference
  /** What is actually applied right now. */
  theme: Theme
  setPreference: (pref: ThemePreference) => void
  /** Resolved accent colours for the applied theme, e.g. '#FF7A5C'. */
  accents: Record<PersonAccent, string>
  /** Resolved page background, for rings that separate a shape from the paper. */
  paper: string
  /** Bloom multiplier for the applied theme. The one dial for more/less neon. */
  glow: number
  /** `multiplier * glow` — the alpha every bloom in the app is built from. */
  glowAlpha: (multiplier: number) => number
  /** An accent at bloom strength, ready to drop into boxShadow or a filter. */
  glowColor: (accent: PersonAccent, multiplier: number) => string
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** The theme the server rendered, and therefore the one React must hydrate. */
const SSR_THEME: Theme = 'night'

// Reading the stored preference has to happen before paint, or a day
// user watches the accents hydrate from night. There is no window on
// the server, and React complains if a layout effect is scheduled there.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return SSR_THEME
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'day' || stored === 'night' || stored === 'system') {
      return stored
    }
  } catch {
    // Safari in private mode throws on localStorage access.
  }
  return SSR_THEME
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Null until the client has read storage. The inline head script has
  // already painted the correct theme; rendering the SSR default until
  // then is what keeps the server and client markup identical, and it
  // is also why nothing writes data-theme before the read lands — doing
  // so would stamp 'night' over the theme the head script resolved.
  const [resolved, setResolved] = useState<{
    preference: ThemePreference
    theme: Theme
  } | null>(null)

  useIsomorphicLayoutEffect(() => {
    const stored = readStoredPreference()
    setResolved({ preference: stored, theme: resolveTheme(stored) })
  }, [])

  const preference = resolved?.preference ?? SSR_THEME
  const theme = resolved?.theme ?? SSR_THEME

  // Only follow the OS while the user has explicitly asked us to.
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () =>
      setResolved({ preference, theme: mq.matches ? 'day' : 'night' })
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  useIsomorphicLayoutEffect(() => {
    if (!resolved) return
    document.documentElement.setAttribute('data-theme', resolved.theme)
  }, [resolved])

  const setPreference = useCallback((pref: ThemePreference) => {
    setResolved({ preference: pref, theme: resolveTheme(pref) })
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref)
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }, [])

  const value = useMemo<ThemeContextValue>(() => {
    const tokens = THEME_TOKENS[theme]
    const glowAlpha = (multiplier: number) => multiplier * tokens.glow
    return {
      preference,
      theme,
      setPreference,
      accents: tokens.accents,
      paper: tokens.paper,
      glow: tokens.glow,
      glowAlpha,
      glowColor: (accent, multiplier) =>
        withAlpha(tokens.accents[accent], glowAlpha(multiplier)),
    }
  }, [preference, theme, setPreference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
