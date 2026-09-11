import { AmbientBackdrop } from '@/components/ui/ambient-backdrop'
import { PERSON_ACCENTS, accentVar } from '@/lib/person-color'

/**
 * Shared frame for the signed-out screens: warm paper, the mesh bloom,
 * and a centred column. These sit outside the (app) group so they don't
 * get the app layout's nav or ThemeProvider — they render in whatever
 * theme the head script resolved, which is all they need.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-paper px-6 py-10">
      <AmbientBackdrop />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}

/**
 * The five family accents as overlapping glowing orbs. Decorative — it
 * stands in for a family before the viewer has one.
 */
export function FamilyOrbs() {
  const letters = ['M', 'R', 'E', 'S', 'A']

  return (
    <div aria-hidden className="mb-7 flex">
      {PERSON_ACCENTS.map((accent, i) => (
        <span
          key={accent}
          className="relative -mr-3 h-11 w-11 flex-none"
          style={{ color: `hsl(${accentVar(accent)})`, zIndex: 5 - i }}
        >
          <span
            className="absolute -inset-2.5 rounded-full bg-current blur-[12px]"
            style={{ opacity: 'calc(0.72 * var(--glow))' }}
          />
          {/* `text-on-accent` must live on a child, not here — setting colour
              on this element would redefine currentColor and make bg-current
              paint the ink shade instead of the accent. */}
          <span
            className="relative grid h-full w-full place-items-center rounded-full bg-current font-display text-[19px] font-black"
            style={{
              boxShadow:
                '0 0 0 3px hsl(var(--paper)), 0 0 0 5px currentColor',
            }}
          >
            <span className="text-on-accent">{letters[i]}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

/** The marigold swash used under headings across the app. */
export function Swash({ className = 'w-36' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 150 9"
      fill="none"
      className={`mt-2 block h-2 text-marigold ${className}`}
      style={{ filter: 'drop-shadow(0 0 8px hsl(var(--marigold) / var(--glow)))' }}
    >
      <path
        d="M2 6.2c25-4.6 50-5.4 75-3.2 24 2.1 48 2.5 72-.7"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
