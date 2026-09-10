import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims() instead of getUser(), because getUser() is an HTTP request to the
  // Supabase Auth server on *every* request this matcher covers — a fixed
  // round-trip in front of every page render and every navigation.
  //
  // getClaims() calls getSession() internally first, so the token is still
  // refreshed and the setAll callback above still writes the rotated cookies;
  // the session-refresh job of this middleware is unchanged. It then verifies
  // the JWT's signature locally via WebCrypto against the project's public JWKS
  // (cached after the first fetch), so the per-request network hop disappears.
  //
  // Unlike a bare getSession(), this is safe on the server: the signature is
  // actually verified rather than trusted.
  //
  // IMPORTANT — this is only a speedup once the project uses asymmetric JWTs.
  // If the project is still on the legacy shared HS256 secret, getClaims() sees
  // an `HS*` alg, cannot verify locally, and falls back to calling getUser()
  // internally. That is exactly today's cost — no regression, no gain. To
  // actually collect the win, enable JWT signing keys in the Supabase dashboard
  // under Authentication -> JWT Keys and migrate to an ECC (ES256) key.
  const { data, error } = await supabase.auth.getClaims()

  const claims = error ? null : data?.claims
  const isAuthenticated = Boolean(claims?.sub)

  const path = request.nextUrl.pathname

  // Routes that must not be redirected to /login.
  //
  // The two /api entries are called machine-to-machine (Vercel Cron, internal
  // callers) and carry no session cookie, so this middleware would otherwise
  // redirect them to /login and the route handler would never run. They
  // authenticate themselves with CRON_SECRET / INTERNAL_API_SECRET instead.
  const publicRoutes = [
    '/login',
    '/auth/callback',
    '/join',
    '/api/cron',
    '/api/notifications/send',
  ]
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  // If not logged in and trying to access protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute && path !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and on login page, redirect to feed
  if (isAuthenticated && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
