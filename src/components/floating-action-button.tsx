'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

// Screens that either are the add flow or have no business offering it.
const HIDDEN_ON = ['/add', '/create-family']

export function FloatingActionButton() {
  const pathname = usePathname()

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) {
    return null
  }

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
          backgroundImage:
            'radial-gradient(circle at 34% 28%, color-mix(in srgb, hsl(var(--coral)) 55%, white), hsl(var(--coral)) 66%)',
          boxShadow:
            '0 0 0 8px hsl(var(--coral) / 0.13), 0 12px 36px -4px hsl(var(--coral) / calc(1 * var(--glow))), inset 0 2px 3px rgb(255 255 255 / 0.5)',
        }}
      >
        <Plus className="h-7 w-7 text-white transition-transform group-hover:scale-110" />
      </Link>
    </div>
  )
}
