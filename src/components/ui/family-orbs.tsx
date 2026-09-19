'use client'

import { useTheme } from '@/components/theme-provider'
import { PERSON_ACCENTS } from '@/lib/person-color'

const LETTERS = ['M', 'R', 'E', 'S', 'A']

/**
 * The five family accents as overlapping glowing orbs. Decorative — it
 * stands in for a family before the viewer has one.
 */
export function FamilyOrbs() {
  const { accents, paper, glowAlpha } = useTheme()

  return (
    <div aria-hidden className="mb-7 flex">
      {PERSON_ACCENTS.map((accent, i) => {
        const color = accents[accent]
        return (
          <span
            key={accent}
            className="relative -mr-3 h-11 w-11 flex-none"
            style={{ color, zIndex: 5 - i }}
          >
            <span
              className="absolute -inset-2.5 rounded-full bg-current blur-[12px]"
              style={{ opacity: glowAlpha(0.72) }}
            />
            {/* `text-on-accent` must live on a child, not here — setting colour
                on this element would redefine currentColor and make bg-current
                paint the ink shade instead of the accent. */}
            <span
              className="relative grid h-full w-full place-items-center rounded-full bg-current font-display text-[19px] font-black"
              style={{ boxShadow: `0 0 0 3px ${paper}, 0 0 0 5px ${color}` }}
            >
              <span className="text-on-accent">{LETTERS[i]}</span>
            </span>
          </span>
        )
      })}
    </div>
  )
}
