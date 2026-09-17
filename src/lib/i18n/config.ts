export const LOCALES = ['en', 'es'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/**
 * Locale lives in a cookie rather than the users table.
 *
 * Server components can read a cookie during render, so the first paint is
 * already in the right language — same reason the theme uses one. It also
 * avoids a migration on a database whose committed migrations are known not
 * to match production.
 *
 * Trade-off: the preference is per-device. Reinstalling the PWA means picking
 * the language once more.
 */
export const LOCALE_COOKIE = 'fp-locale'

/** A year — this is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}
