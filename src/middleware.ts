import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json, sw.js (PWA install + push; the browser may request
     *   these without credentials, and redirecting them to /login breaks
     *   both Home Screen install and service worker registration)
     * - offline (the worker's navigation fallback. It precaches this at
     *   install time with no session, so a redirect to /login would be
     *   cached under /offline and then shown whenever the network drops)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
