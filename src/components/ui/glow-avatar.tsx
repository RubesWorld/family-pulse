'use client'

import { cn } from '@/lib/utils'
import { useTheme } from '@/components/theme-provider'
import {
  getInitials,
  personAccent,
  type PersonAccent,
} from '@/lib/person-color'

const SIZES = {
  xs: { box: 'h-7 w-7', text: 'text-[12px]', bloom: '-inset-1.5', blur: 'blur-[7px]' },
  sm: { box: 'h-9 w-9', text: 'text-[15px]', bloom: '-inset-2', blur: 'blur-[9px]' },
  md: { box: 'h-11 w-11', text: 'text-[19px]', bloom: '-inset-2.5', blur: 'blur-[12px]' },
  lg: { box: 'h-14 w-14', text: 'text-[24px]', bloom: '-inset-3', blur: 'blur-[14px]' },
  xl: { box: 'h-[72px] w-[72px]', text: 'text-[31px]', bloom: '-inset-3.5', blur: 'blur-[16px]' },
} as const

export type AvatarSize = keyof typeof SIZES

interface GlowAvatarProps {
  name: string | null | undefined
  userId: string | null | undefined
  avatarUrl?: string | null
  size?: AvatarSize
  /** Override the hashed accent (used by the theme preview). */
  accent?: PersonAccent
  className?: string
}

/**
 * An avatar sitting in a soft bloom of its owner's colour. The bloom is
 * a blurred sibling rather than a box-shadow so it can be clipped and
 * scaled independently, and it dims automatically in day via --glow.
 */
export function GlowAvatar({
  name,
  userId,
  avatarUrl,
  size = 'md',
  accent,
  className,
}: GlowAvatarProps) {
  const { accents, paper, glowAlpha } = useTheme()
  const tone = accent ?? personAccent(userId)
  const s = SIZES[size]
  const color = accents[tone]

  return (
    <span
      className={cn('relative flex-none', s.box, className)}
      style={{ color }}
    >
      <span
        aria-hidden
        className={cn(
          'absolute rounded-full bg-current',
          s.bloom,
          s.blur
        )}
        style={{ opacity: glowAlpha(0.72) }}
      />
      <span
        className={cn(
          'relative z-10 grid h-full w-full place-items-center overflow-hidden rounded-full bg-current font-display font-black',
          s.text
        )}
        style={{
          boxShadow: `0 0 0 3px ${paper}, 0 0 0 5px ${color}`,
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name ?? 'Family member'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-on-accent">{getInitials(name)}</span>
        )}
      </span>
    </span>
  )
}
