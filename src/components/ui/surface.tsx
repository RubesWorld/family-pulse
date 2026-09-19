import { cn } from '@/lib/utils'

// Lives in its own file because it needs the theme's glow multiplier,
// and therefore the client, which Surface and SectionHeader do not.
export { NoteCallout } from '@/components/ui/note-callout'

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
            'repeating-linear-gradient(90deg, var(--edge) 0 7px, transparent 7px 13px)',
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
