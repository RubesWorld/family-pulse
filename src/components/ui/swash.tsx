'use client'

import { useTheme } from '@/components/theme-provider'

/**
 * The marigold swash ruled under headings across the app.
 *
 * Two hand-drawn curves, not one scaled curve: the auth screens use a
 * longer, lazier stroke than the in-app page headers, and squeezing
 * either into the other's viewBox visibly changes the arc. They are
 * kept as named profiles so there is still one component, one glow and
 * one place to change the shape.
 */
const PROFILES = {
  /** Signed-out screens: wider, with room to breathe under a big title. */
  auth: {
    viewBox: '0 0 150 9',
    d: 'M2 6.2c25-4.6 50-5.4 75-3.2 24 2.1 48 2.5 72-.7',
    spacing: 'mt-2',
  },
  /** In-app page headers: tucked up under the family name. */
  header: {
    viewBox: '0 0 132 9',
    d: 'M2 6.2c22-4.4 44-5.2 66-3.1 21 2 42 2.4 63-.6',
    spacing: 'mt-0.5',
  },
} as const

export function Swash({
  profile = 'auth',
  className = 'w-36',
}: {
  profile?: keyof typeof PROFILES
  className?: string
}) {
  const { glowColor } = useTheme()
  const { viewBox, d, spacing } = PROFILES[profile]

  return (
    <svg
      aria-hidden
      viewBox={viewBox}
      fill="none"
      className={`${spacing} block h-2 text-marigold ${className}`}
      // The stroke keeps inheriting from text-marigold so it is correct
      // at first paint; only the bloom needs a resolved colour, because
      // it also has to carry the --glow multiplier.
      style={{ filter: `drop-shadow(0 0 8px ${glowColor('marigold', 1)})` }}
    >
      <path d={d} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
