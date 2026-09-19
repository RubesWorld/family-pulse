'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, HeartHandshake, Users, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const LEFT_ITEMS = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/connect', icon: HeartHandshake, label: 'Connect' },
]

const RIGHT_ITEMS = [
  { href: '/family', icon: Users, label: 'Family' },
  { href: '/profile', icon: User, label: 'Profile' },
]

function NavItem({
  href,
  icon: Icon,
  label,
  pathname,
}: {
  href: string
  icon: typeof Home
  label: string
  pathname: string
}) {
  // Sub-routes like /connect/history should keep their tab lit.
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 rounded-[18px] py-1.5 transition-colors',
        isActive ? 'text-coral' : 'text-ink-faint hover:text-ink-soft'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[9.5px] font-extrabold">{label}</span>
    </Link>
  )
}

/**
 * Five slots, with Add in the middle.
 *
 * Add used to be a floating button over the bottom-right of the feed, where
 * it permanently covered whatever card happened to be underneath it. Putting
 * it in the bar means it never occludes content, and it is easier to reach
 * with a thumb than a corner.
 */
export function BottomNav() {
  const pathname = usePathname()
  const onAdd = pathname.startsWith('/add')

  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-card border-card border-edge bg-nav px-2 py-2 shadow-nav backdrop-blur-[30px] backdrop-saturate-150 safe-area-pb">
      <div className="flex items-center justify-around gap-1">
        {LEFT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}

        <Link
          href="/add"
          aria-label="Add"
          aria-current={onAdd ? 'page' : undefined}
          className="grid h-12 w-12 flex-none place-items-center rounded-full transition-transform active:scale-95"
          style={{
            backgroundImage:
              'radial-gradient(circle at 34% 28%, color-mix(in srgb, hsl(var(--coral)) 55%, white), hsl(var(--coral)) 66%)',
            boxShadow:
              '0 6px 20px -4px hsl(var(--coral) / calc(0.95 * var(--glow))), inset 0 2px 3px rgb(255 255 255 / 0.45)',
          }}
        >
          <Plus className="h-6 w-6 text-white" />
        </Link>

        {RIGHT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}
      </div>
    </nav>
  )
}
