import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/queries'
import { BottomNav } from '@/components/bottom-nav'
import { FloatingActionButton } from '@/components/floating-action-button'
import { AmbientBackdrop } from '@/components/ui/ambient-backdrop'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/components/i18n-provider'
import { getLocale } from '@/lib/i18n/server'

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

  // Read from the cookie during render so the first paint is already in the
  // right language — no flash of English.
  const locale = await getLocale()

  return (
    <I18nProvider locale={locale}>
      <ThemeProvider>
        <div className="relative min-h-screen bg-paper">
          <AmbientBackdrop />
          {/* pb clears the floating nav plus the iOS home indicator */}
          <div className="relative z-10 pb-32">{children}</div>
          <FloatingActionButton />
          <BottomNav />
        </div>
      </ThemeProvider>
    </I18nProvider>
  )
}
