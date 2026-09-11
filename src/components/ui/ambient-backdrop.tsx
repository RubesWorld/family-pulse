import { cn } from '@/lib/utils'

/**
 * The warm mesh bloom that sits behind every screen, plus the paper
 * grain on top. Fixed rather than absolute so it stays put while the
 * content scrolls, and fully inert to pointer events.
 *
 * Blob positions are deliberately static — a random layout per render
 * would shift under the user on every navigation.
 */
export function AmbientBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden',
        className
      )}
    >
      <div
        className="absolute -inset-1/4 blur-[70px]"
        style={{ opacity: 'var(--ambient-opacity)' }}
      >
        {/* Warm blobs lead; the cool ones sit lower and lighter so the
            paper never drifts grey. */}
        <span className="absolute -left-[16%] -top-[2%] block h-80 w-80 rounded-full bg-coral opacity-[0.85]" />
        <span className="absolute -right-[20%] top-[20%] block h-72 w-72 rounded-full bg-marigold opacity-[0.62]" />
        <span className="absolute -left-[12%] bottom-[12%] block h-72 w-72 rounded-full bg-plum opacity-[0.38]" />
        <span className="absolute -right-[12%] bottom-[28%] block h-60 w-60 rounded-full bg-sage opacity-[0.26]" />
      </div>

      <div
        className="absolute inset-0"
        style={{
          opacity: 'var(--grain-opacity)',
          mixBlendMode: 'var(--grain-blend)' as React.CSSProperties['mixBlendMode'],
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.88' numOctaves='2'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
