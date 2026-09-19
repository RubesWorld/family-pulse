import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/queries'
import { BottomNav } from '@/components/bottom-nav'
import { FloatingActionButton } from '@/components/floating-action-button'
import { AmbientBackdrop } from '@/components/ui/ambient-backdrop'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { SessionProvider } from '@/lib/supabase/session-context'
import type { ProfileWithFamily } from '@/lib/queries/profile'
import { PwaRuntime } from '@/lib/pwa-runtime'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Both of these are request-cached, so the pages nested below reuse these
  // exact results rather than re-fetching the user and profile themselves.
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()

  if (!profile?.family_id) {
    redirect('/create-family')
  }

  return (
    <ThemeProvider>
      {/* Both providers live in the (app) group rather than the root layout.
          /login, /join/[code] and /create-family need no cache and no session
          context, and keeping them out means those screens do not pay for it.

          The redirects above stay where they are. Moving the auth gate into a
          client effect would trade a server redirect for a flash of empty UI
          followed by a client-side redirect — on exactly the screens this is
          meant to make feel faster.

          The user and profile passed down are the ones the redirect check just
          resolved, so seeding costs nothing. */}
      <QueryProvider>
        <SessionProvider
          initialUser={{
            id: user.id,
            email: typeof user.email === 'string' ? user.email : null,
          }}
          /* The generated Database type does not describe the embedded
             families relation; the assertion is stated once, here and in
             queries/profile.ts, instead of at each read site. */
          initialProfile={profile as ProfileWithFamily}
        >
          {/* Renders nothing; mounted here because it needs a signed-in session
              to save a subscription, and this is the only shell that guarantees
              one. The id is passed because a push endpoint identifies the device,
              not the account, so on a shared phone it is the only way to tell
              whose subscription is currently on file. */}
          <PwaRuntime userId={user.id} />
          <div className="relative min-h-screen bg-paper">
            <AmbientBackdrop />
            {/* pb clears the floating nav plus the iOS home indicator */}
            <div className="relative z-10 pb-32">{children}</div>
            <FloatingActionButton />
            <BottomNav />
          </div>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
