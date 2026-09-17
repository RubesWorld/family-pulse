'use client'

import { useI18n } from '@/components/i18n-provider'
import type { User } from '@/types/database'

type BioKey = 'location' | 'occupation' | 'birthday' | 'bio'

const ROWS: { key: BioKey; emoji: string }[] = [
  { key: 'location', emoji: '📍' },
  { key: 'occupation', emoji: '💼' },
  { key: 'birthday', emoji: '🎂' },
  { key: 'bio', emoji: '✍️' },
]

export type BioFields = Pick<User, BioKey>

export function hasAnyBio(person: Partial<BioFields>): boolean {
  return !!(person.location || person.occupation || person.birthday || person.bio)
}

/**
 * A person's bio, rendered identically whether you are looking at yourself in
 * Profile or at someone else from Family. These were two separate copies of
 * the same markup and the same field list until this was pulled out.
 */
export function BioRows({ person }: { person: Partial<BioFields> }) {
  const { dict, locale } = useI18n()

  const labels: Record<BioKey, string> = {
    location: dict.person.location,
    occupation: dict.person.work,
    birthday: dict.person.birthday,
    bio: dict.person.bio,
  }

  return (
    <div className="-my-1">
      {ROWS.map(({ key, emoji }) => {
        const value = person[key]
        if (!value) return null

        return (
          <div
            key={key}
            className="flex items-start gap-3 border-b border-dashed border-edge py-2.5 last:border-b-0"
          >
            <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-paper-2 text-sm">
              {emoji}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">
                {labels[key]}
              </div>
              <div
                className={
                  key === 'bio'
                    ? 'mt-0.5 text-[13px] font-medium leading-relaxed text-ink-soft'
                    : 'mt-0.5 text-[13.5px] font-bold text-ink'
                }
              >
                {key === 'birthday'
                  ? new Date(value).toLocaleDateString(
                      locale === 'es' ? 'es-MX' : 'en-US',
                      { month: 'long', day: 'numeric' }
                    )
                  : value}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
