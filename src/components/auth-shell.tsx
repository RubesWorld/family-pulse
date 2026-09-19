import { AmbientBackdrop } from '@/components/ui/ambient-backdrop'
import { ThemeProvider } from '@/components/theme-provider'

// Kept as re-exports: the signed-out pages have always imported both
// from here, and both now live with the rest of the design primitives.
export { Swash } from '@/components/ui/swash'
export { FamilyOrbs } from '@/components/ui/family-orbs'

/**
 * Shared frame for the signed-out screens: warm paper, the mesh bloom,
 * and a centred column. These sit outside the (app) group, so they bring
 * their own ThemeProvider rather than the app layout's — the head script
 * has already resolved and painted the theme, and the provider is what
 * lets the orbs and the swash resolve their colours in JS rather than
 * leaning on a CSS variable an inline style can't carry off the web.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="relative flex min-h-screen items-center justify-center bg-paper px-6 py-10">
        <AmbientBackdrop />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </ThemeProvider>
  )
}
