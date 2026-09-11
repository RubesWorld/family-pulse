'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, HeartHandshake, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/connect', icon: HeartHandshake, label: 'Connect' },
  { href: '/family', icon: Users, label: 'Family' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-card border-card border-edge bg-nav px-2 py-2 shadow-nav backdrop-blur-[30px] backdrop-saturate-150 safe-area-pb">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          // Sub-routes like /connect/history should keep Connect lit.
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-0.5 rounded-[18px] px-3 py-1.5 transition-colors',
                isActive
                  ? 'bg-coral/[0.18] text-coral'
                  : 'text-ink-faint hover:text-ink-soft'
              )}
              style={
                isActive
                  ? {
                      boxShadow:
                        '0 4px 20px -3px hsl(var(--coral) / calc(0.8 * var(--glow)))',
                    }
                  : undefined
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9.5px] font-extrabold">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
