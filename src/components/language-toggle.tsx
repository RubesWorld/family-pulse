'use client'

import { useI18n } from '@/components/i18n-provider'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  return (
    <div
      role="radiogroup"
      aria-label={LOCALE_LABELS[locale]}
      className="flex gap-1 rounded-full border-card border-edge bg-card p-1 backdrop-blur-card"
    >
      {LOCALES.map((value) => {
        const active = locale === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLocale(value)}
            // Each option is written in its own language — someone looking for
            // Spanish should not have to read English to find it.
            lang={value}
            className={cn(
              'flex-1 rounded-full px-3 py-2 text-xs font-extrabold transition-colors',
              active
                ? 'bg-coral text-on-ink shadow-[0_5px_18px_-4px_hsl(var(--coral)/0.8)]'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            {LOCALE_LABELS[value]}
          </button>
        )
      })}
    </div>
  )
}
