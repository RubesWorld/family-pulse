'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchProfile,
  profileKeys,
  type ProfileWithFamily,
} from '@/lib/queries/profile'
import type { DbClient } from '@/lib/queries/types'
import { createClient } from './client'

export interface SessionUser {
  id: string
  email: string | null
}

interface SessionContextValue {
  /**
   * The browser Supabase client. Handed out here rather than constructed per
   * component so every `queryFn` is demonstrably running against the same
   * session.
   */
  supabase: DbClient
  user: SessionUser | null
  profile: ProfileWithFamily | null
  familyId: string | null
  /** True only before the profile is known — never on a seeded first paint. */
  isLoading: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Makes the signed-in user and their family available to every client query.
 *
 * No new auth transport is involved. Auth state lives in the Supabase cookies
 * that `@supabase/ssr` writes, and `createBrowserClient` reads those same
 * cookies — that is what the package is for. What is added here is the two
 * values every query key needs (`user.id`, `familyId`), scoped so that a
 * sign-out or a family change cannot serve the previous user's cached rows.
 *
 * `initialUser` / `initialProfile` come from the `(app)` layout, which has
 * already resolved both for its redirect check. Reusing them means a cold load
 * costs exactly what it costs today while every navigation after it is a cache
 * read.
 */
export function SessionProvider({
  initialUser,
  initialProfile,
  children,
}: {
  initialUser: SessionUser
  initialProfile: ProfileWithFamily | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // `createBrowserClient` already returns a per-tab singleton, so this is not
  // what prevents duplicate GoTrueClient instances — it just keeps the
  // reference stable across renders.
  const [supabase] = useState<DbClient>(() => createClient())

  const [user, setUser] = useState<SessionUser | null>(initialUser)

  const userId = user?.id ?? initialUser.id

  const { data: profile, isPending } = useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => fetchProfile(supabase, userId),
    // Seeded, so there is no fetch on first paint and no loading flash. It goes
    // stale on the provider's normal schedule and refreshes from there.
    //
    // Only for the user the layout actually resolved. If someone else signs in
    // in this tab the key changes, and seeding the new key with the previous
    // person's profile is precisely the leak the key scoping exists to prevent.
    initialData: userId === initialUser.id ? initialProfile : undefined,
    enabled: user !== null,
  })

  // Read inside the auth callback so the "is this the same person?" comparison
  // does not have to happen inside a state updater — updaters can run twice,
  // and clearing the cache is not something to do speculatively.
  const userIdRef = useRef<string | null>(initialUser.id)
  userIdRef.current = user?.id ?? null

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user

      if (event === 'SIGNED_OUT' || !nextUser) {
        // Clear, not invalidate: invalidated entries are still readable while
        // they refetch, and the next person to sign in on this device would see
        // them.
        queryClient.clear()
        userIdRef.current = null
        setUser(null)
        router.replace('/login')
        return
      }

      // TOKEN_REFRESHED and USER_UPDATED arrive for the same person, and
      // re-keying every query on each token refresh would throw the cache away
      // on a timer.
      if (userIdRef.current === nextUser.id) return

      queryClient.clear()
      userIdRef.current = nextUser.id
      setUser({ id: nextUser.id, email: nextUser.email ?? null })
    })

    return () => subscription.unsubscribe()
  }, [supabase, queryClient, router])

  const value = useMemo<SessionContextValue>(
    () => ({
      supabase,
      user,
      profile: profile ?? null,
      familyId: profile?.family_id ?? null,
      isLoading: user !== null && isPending,
    }),
    [supabase, user, profile, isPending]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
