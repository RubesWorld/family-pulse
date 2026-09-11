'use client'

import { PRESET_INTERESTS } from '@/lib/interests'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterestSelectorProps {
  selectedInterests: string[]
  onToggle: (interestId: string) => void
}

export function InterestSelector({
  selectedInterests,
  onToggle,
}: InterestSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {PRESET_INTERESTS.map((interest) => {
        const isSelected = selectedInterests.includes(interest.id)

        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => onToggle(interest.id)}
            aria-pressed={isSelected}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 rounded-panel border-[1.5px] p-3 transition-all active:scale-[0.97]',
              isSelected
                ? 'border-coral bg-coral/[0.16]'
                : 'border-edge bg-card hover:border-ink-faint'
            )}
            style={
              isSelected
                ? {
                    boxShadow:
                      '0 5px 20px -5px hsl(var(--coral) / calc(0.7 * var(--glow)))',
                  }
                : undefined
            }
          >
            {isSelected && (
              <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-coral">
                <Check className="h-2.5 w-2.5 text-on-ink" />
              </span>
            )}
            <span className="text-2xl" aria-hidden>
              {interest.emoji}
            </span>
            <span
              className={cn(
                'text-[11px] font-extrabold',
                isSelected ? 'text-coral' : 'text-ink-soft'
              )}
            >
              {interest.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
