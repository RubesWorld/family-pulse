'use client'

import { Moon, Sun, Smartphone } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useI18n } from '@/components/i18n-provider'
import type { ThemePreference } from '@/lib/theme-script'
import { cn } from '@/lib/utils'

const OPTIONS: {
  value: ThemePreference
  key: 'themeNight' | 'themeDay' | 'themeAuto'
  icon: typeof Moon
}[] = [
  { value: 'night', key: 'themeNight', icon: Moon },
  { value: 'day', key: 'themeDay', icon: Sun },
  { value: 'system', key: 'themeAuto', icon: Smartphone },
]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const { dict } = useI18n()

  return (
    <div
      role="radiogroup"
      aria-label={dict.settings.appearance}
      className="flex gap-1 rounded-full border-card border-edge bg-card p-1 backdrop-blur-card"
    >
      {OPTIONS.map(({ value, key, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-extrabold transition-colors',
              active
                ? 'bg-coral text-on-ink shadow-[0_5px_18px_-4px_hsl(var(--coral)/0.8)]'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {dict.settings[key]}
          </button>
        )
      })}
    </div>
  )
}
