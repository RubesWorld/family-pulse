'use client'

import { InterestCardWithUser } from '@/types/database'
import { PRESET_INTERESTS, getInterestById } from '@/lib/interests'
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
const INTEREST_TINT: Record<string, string> = {
  music: 'var(--denim)',
  movies: 'var(--plum)',
  reading: 'var(--plum)',
  books: 'var(--plum)',
  sports: 'var(--sage)',
  fitness: 'var(--sage)',
  nature: 'var(--sage)',
  gardening: 'var(--sage)',
  cooking: 'var(--marigold)',
  art: 'var(--coral)',
  crafts: 'var(--coral)',
  pets: 'var(--marigold)',
  travel: 'var(--denim)',
  tech: 'var(--denim)',
  gaming: 'var(--plum)',
  photography: 'var(--coral)',
}

function tintFor(category: string): string {
  return INTEREST_TINT[category.toLowerCase()] ?? 'var(--coral)'
}

export function InterestCard({
  interest,
  onClick,
  isSelected,
}: InterestCardProps) {
  const preset =
    getInterestById(interest.category) ??
    PRESET_INTERESTS.find((p) => p.id === interest.category)
  const label = preset?.label || interest.category
  const tint = tintFor(interest.category)

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
          background: `radial-gradient(circle at 82% 18%, hsl(${tint}), transparent 62%)`,
          opacity: 'calc(0.16 * var(--glow) + 0.06)',
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
