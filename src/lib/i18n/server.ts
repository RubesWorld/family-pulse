import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'
import { getDictionary } from './index'

/**
 * Resolves the locale during server render, so the first paint is already in
 * the right language — no flash of English, no client round-trip.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export async function getServerDictionary() {
  const locale = await getLocale()
  return { locale, dict: getDictionary(locale) }
}
