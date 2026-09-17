import { cn } from '@/lib/utils'
import { promptEmoji, promptGradient } from '@/lib/pick-prompts'

const SIZES = {
  sm: { box: 'h-[42px] w-[42px]', radius: 'rounded-[14px]', text: 'text-[21px]', bloom: '-inset-2' },
  md: { box: 'h-[52px] w-[52px]', radius: 'rounded-2xl', text: 'text-[25px]', bloom: '-inset-2.5' },
} as const

/**
 * A pick rendered as a tilted sticker that spills its gradient onto the
 * surface beneath it. Colour and emoji now come from the interest behind the
 * prompt, so a hiking pick looks like nature rather than like a fixed
 * category. The bloom scales with --glow so day mode stays subtle.
 */
export function PickSticker({
  category,
  size = 'md',
  className,
}: {
  /** The stored picks.category value — a prompt id, or a legacy category. */
  category: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const s = SIZES[size]
  const gradient = promptGradient(category)

  return (
    <span className={cn('relative flex-none', s.box, className)}>
      <span
        aria-hidden
        className={cn('absolute rounded-[18px] blur-[14px]', s.bloom)}
        style={{ backgroundImage: gradient, opacity: 'calc(0.8 * var(--glow))' }}
      />
      <span
        className={cn(
          'relative z-10 grid h-full w-full -rotate-[7deg] place-items-center',
          s.radius,
          s.text
        )}
        style={{
          backgroundImage: gradient,
          boxShadow:
            '0 5px 14px -4px rgb(0 0 0 / 0.55), inset 0 0 0 2px rgb(255 255 255 / 0.4)',
        }}
      >
        <span role="img" aria-hidden>
          {promptEmoji(category)}
        </span>
      </span>
    </span>
  )
}
