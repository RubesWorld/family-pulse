import { cn } from '@/lib/utils'

/**
 * The base frosted/solid card used everywhere. Night renders it as
 * translucent glass over the mesh; day renders it solid cream. Both
 * come from tokens, so this component never branches on theme.
 */
export function Surface({
  className,
  tilt,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** Fractional rotation for feed cards. Never use on anything with an input. */
  tilt?: 'a' | 'b'
}) {
  return (
    <div
      className={cn(
        'relative rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card',
        tilt === 'a' && 'tilt-a',
        tilt === 'b' && 'tilt-b',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Serif section heading with the dashed rule running off to the right. */
export function SectionHeader({
  children,
  className,
  action,
}: {
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <div className={cn('flex items-center gap-2.5 px-5 pb-2.5 pt-5', className)}>
      <h2 className="whitespace-nowrap font-display text-sm font-black text-ink">
        {children}
      </h2>
      <div
        aria-hidden
        className="h-0.5 flex-1"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, hsl(var(--edge) / var(--edge-alpha)) 0 7px, transparent 7px 13px)',
        }}
      />
      {action}
    </div>
  )
}

/** Small pill for time, place and tags. */
export function MetaChip({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-1 text-[11.5px] font-extrabold text-ink-soft',
        className
      )}
    >
      {Icon ? <Icon className="h-3 w-3 flex-none" /> : null}
      {children}
    </span>
  )
}

/** The marigold-bordered aside used for "notes for family". */
export function NoteCallout({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    // Square-ish left edge so the marigold rule reads as a margin note.
    // A fully-rounded pill made this look like an empty text input.
    <p
      className={cn(
        'rounded-l-[4px] rounded-r-2xl border-l-[3px] border-marigold/75 bg-marigold/[0.11] px-3.5 py-2.5 font-display text-[14px] italic leading-relaxed text-ink-soft',
        className
      )}
      style={{
        boxShadow:
          '0 4px 22px -8px hsl(var(--marigold) / calc(0.55 * var(--glow)))',
      }}
    >
      {children}
    </p>
  )
}
