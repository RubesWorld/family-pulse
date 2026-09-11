import { cn } from '@/lib/utils'
import { getPickCategory } from '@/lib/pick-categories'

const SIZES = {
  sm: { box: 'h-[42px] w-[42px]', radius: 'rounded-[14px]', text: 'text-[21px]', bloom: '-inset-2' },
  md: { box: 'h-[52px] w-[52px]', radius: 'rounded-2xl', text: 'text-[25px]', bloom: '-inset-2.5' },
} as const

/**
 * A pick rendered as a tilted sticker that spills its gradient onto the
 * surface beneath it. The bloom is a blurred copy of the same gradient,
 * scaled by --glow so day mode stays subtle.
 */
export function PickSticker({
  category,
  size = 'md',
  className,
}: {
  category: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const cat = getPickCategory(category)
  if (!cat) return null

  const s = SIZES[size]

  return (
    <span className={cn('relative flex-none', s.box, className)}>
      <span
        aria-hidden
        className={cn('absolute rounded-[18px] blur-[14px]', s.bloom)}
        style={{
          backgroundImage: cat.gradient,
          opacity: 'calc(0.8 * var(--glow))',
        }}
      />
      <span
        className={cn(
          'relative z-10 grid h-full w-full -rotate-[7deg] place-items-center',
          s.radius,
          s.text
        )}
        style={{
          backgroundImage: cat.gradient,
          boxShadow:
            '0 5px 14px -4px rgb(0 0 0 / 0.55), inset 0 0 0 2px rgb(255 255 255 / 0.4)',
        }}
      >
        <span role="img" aria-label={cat.label}>
          {cat.emoji}
        </span>
      </span>
    </span>
  )
}
