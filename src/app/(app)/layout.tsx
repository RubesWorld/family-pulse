import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/queries'
import { BottomNav } from '@/components/bottom-nav'
import { FloatingActionButton } from '@/components/floating-action-button'

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <BottomNav />
      <FloatingActionButton />
    </div>
  )
}
