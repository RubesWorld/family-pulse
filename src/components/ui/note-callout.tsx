'use client'

import { cn } from '@/lib/utils'
import { useTheme } from '@/components/theme-provider'

/** The marigold-bordered aside used for "notes for family". */
export function NoteCallout({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { glowColor } = useTheme()

  return (
    // Square-ish left edge so the marigold rule reads as a margin note.
    // A fully-rounded pill made this look like an empty text input.
    <p
      className={cn(
        'rounded-l-[4px] rounded-r-2xl border-l-[3px] border-marigold/75 bg-marigold/[0.11] px-3.5 py-2.5 font-display text-[14px] italic leading-relaxed text-ink-soft',
        className
      )}
      style={{ boxShadow: `0 4px 22px -8px ${glowColor('marigold', 0.55)}` }}
    >
      {children}
    </p>
  )
}
