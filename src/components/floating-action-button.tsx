'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { mixSrgb, withAlpha } from '@/lib/theme-tokens'

// Screens that either are the add flow or have no business offering it.
const HIDDEN_ON = ['/add', '/create-family']

export function FloatingActionButton() {
  const pathname = usePathname()
  const { accents, glowColor } = useTheme()

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) {
    return null
  }

  const coral = accents.coral
  // The off-centre highlight: coral lifted 45% of the way to white.
  const highlight = mixSrgb(coral, 0.55, '#FFFFFF')

  return (
    // Anchored to the content column rather than the viewport edge. On a
    // phone these are the same thing; on a wide window pinning to the far
    // right strands the button metres away from the feed it belongs to.
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 mx-auto flex max-w-lg justify-end px-5">
      <Link
        href="/add"
        aria-label="Add activity"
        className="group pointer-events-auto grid h-14 w-14 place-items-center rounded-full transition-transform active:scale-95"
        style={{
          backgroundImage: `radial-gradient(circle at 34% 28%, ${highlight}, ${coral} 66%)`,
          boxShadow: [
            `0 0 0 8px ${withAlpha(coral, 0.13)}`,
            `0 12px 36px -4px ${glowColor('coral', 1)}`,
            'inset 0 2px 3px rgb(255 255 255 / 0.5)',
          ].join(', '),
        }}
      >
        <Plus className="h-7 w-7 text-white transition-transform group-hover:scale-110" />
      </Link>
    </div>
  )
}
