'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { es as esLocale, enUS } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from '@/lib/i18n/config'
import { getDictionary, type Dictionary } from '@/lib/i18n'

interface I18nContextValue {
  locale: Locale
  dict: Dictionary
  /** For date-fns formatDistanceToNow / format, so timestamps localise too. */
  dateLocale: DateFnsLocale
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const DATE_LOCALES: Record<Locale, DateFnsLocale> = {
  en: enUS,
  es: esLocale,
}

export function I18nProvider({
  locale,
  children,
}: {
  /** Resolved on the server from the cookie and passed down. */
  locale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()

  const setLocale = useCallback(
    (next: Locale) => {
      // Server components read this cookie during render, so the page has to
      // be re-rendered on the server for the new language to take effect.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
      router.refresh()
    },
    [router]
  )

  const value = useMemo(
    () => ({
      locale,
      dict: getDictionary(locale),
      dateLocale: DATE_LOCALES[locale],
      setLocale,
    }),
    [locale, setLocale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
