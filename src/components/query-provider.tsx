'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isAuthError } from '@/lib/queries/errors'
import { createClient } from '@/lib/supabase/client'

/**
 * Family data changes on human timescales, so half a minute of staleness is
 * invisible. What it buys is the point of the whole refactor: switching tabs
 * inside that window is a cache read, not a round-trip and a skeleton.
 */
const STALE_TIME_MS = 30_000

/** Long enough that leaving a tab and coming back is still instant. */
const GC_TIME_MS = 5 * 60_000

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // Created inside the initializer, never at module scope. At module scope a
  // single QueryClient would be shared across every request a server instance
  // handles, which is one user's rows served to the next.
  const [queryClient] = useState(() => {
    // One-shot. A dead session fails every in-flight query at once, and without
    // the latch that is N sign-out calls and N redirects.
    let signingOut = false

    const client = new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          if (!isAuthError(error) || signingOut) return
          signingOut = true

          // Server-side an expired token never reached a rendered page —
          // middleware redirected first. Client-side the page is already up, so
          // an expired token would otherwise show as a silently empty screen
          // with no explanation and no way out.
          void createClient()
            .auth.signOut()
            .catch(() => {
              // Already invalid as far as the server is concerned; the redirect
              // is what matters.
            })
            .finally(() => {
              client.clear()
              router.replace('/login')
            })
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: STALE_TIME_MS,
          gcTime: GC_TIME_MS,
          // The mechanism that makes a returning PWA feel live: reopening the
          // app from the Home Screen revalidates instead of showing whatever
          // was on screen when it was backgrounded.
          refetchOnWindowFocus: true,
          // Retrying a rejected JWT just fails again, more slowly.
          retry: (failureCount, error) =>
            !isAuthError(error) && failureCount < 1,
        },
      },
    })

    return client
  })

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
