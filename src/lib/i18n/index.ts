import { en, type Dictionary } from './dictionaries/en'
import { es } from './dictionaries/es'
import { DEFAULT_LOCALE, type Locale } from './config'

const DICTIONARIES: Record<Locale, Dictionary> = { en, es }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

/**
 * Fills {placeholders} in a dictionary string.
 *
 *   t(d.picks.summaryMany, { count: 4 })  ->  "4 answers"
 */
export function t(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  )
}

/** Picks the right string for a count. Both locales pluralise the same way here. */
export function plural(
  count: number,
  forms: { none: string; one: string; many: string }
) {
  if (count === 0) return forms.none
  if (count === 1) return forms.one
  return t(forms.many, { count })
}

export type { Dictionary }
export { en, es }
