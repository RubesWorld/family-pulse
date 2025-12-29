'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

export function FloatingActionButton() {
  const pathname = usePathname()

  // Hide FAB on the /add page itself
  if (pathname === '/add') {
    return null
  }

  return (
    <Link
      href="/add"
      className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      aria-label="Add activity or pick"
    >
      <Plus className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:scale-110 transition-transform" />
    </Link>
  )
}
