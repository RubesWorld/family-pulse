'use client'

import { InterestCardWithUser } from '@/types/database'
import { PRESET_INTERESTS, getInterestById } from '@/lib/interests'
import { useTheme } from '@/components/theme-provider'
import type { PersonAccent } from '@/lib/person-color'
import { cn } from '@/lib/utils'

interface InterestCardProps {
  interest: InterestCardWithUser
  onClick?: () => void
  isSelected?: boolean
}

/**
 * Each interest washes its card with its own colour. The wash is a
 * radial gradient behind the content rather than a flat background, so
 * it reads as light falling on the card in both themes.
 */
const INTEREST_TINT: Record<string, PersonAccent> = {
  music: 'denim',
  movies: 'plum',
  reading: 'plum',
  books: 'plum',
  sports: 'sage',
  fitness: 'sage',
  nature: 'sage',
  gardening: 'sage',
  cooking: 'marigold',
  art: 'coral',
  crafts: 'coral',
  pets: 'marigold',
  travel: 'denim',
  tech: 'denim',
  gaming: 'plum',
  photography: 'coral',
}

function tintFor(category: string): PersonAccent {
  return INTEREST_TINT[category.toLowerCase()] ?? 'coral'
}

export function InterestCard({
  interest,
  onClick,
  isSelected,
}: InterestCardProps) {
  const { accents, glow } = useTheme()
  const preset =
    getInterestById(interest.category) ??
    PRESET_INTERESTS.find((p) => p.id === interest.category)
  const label = preset?.label || interest.category
  const tint = accents[tintFor(interest.category)]

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'relative w-full overflow-hidden rounded-panel border-card border-edge p-4 text-left backdrop-blur-card transition-transform',
        onClick && 'active:scale-[0.98]',
        isSelected && 'ring-2 ring-coral'
      )}
    >
      {/* colour wash */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 82% 18%, ${tint}, transparent 62%)`,
          // A floor under the wash so it does not vanish in day.
          opacity: 0.16 * glow + 0.06,
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2.5">
          {preset?.emoji && (
            <span className="text-xl" role="img" aria-hidden>
              {preset.emoji}
            </span>
          )}
          <h3 className="font-display text-[17px] font-bold text-ink">
            {label}
          </h3>
        </div>

        {interest.description && (
          <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-ink-soft">
            {interest.description}
          </p>
        )}

        {interest.tags && interest.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {interest.tags.map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-paper-2 px-2.5 py-1 text-[10.5px] font-extrabold text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  )
}
