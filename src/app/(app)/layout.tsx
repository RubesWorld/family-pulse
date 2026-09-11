import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import { FloatingActionButton } from '@/components/floating-action-button'
import { AmbientBackdrop } from '@/components/ui/ambient-backdrop'
import { ThemeProvider } from '@/components/theme-provider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has a family
  const { data: profile } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single()

  if (!profile?.family_id) {
    redirect('/create-family')
  }

  return (
    <ThemeProvider>
      <div className="relative min-h-screen bg-paper">
        <AmbientBackdrop />
        {/* pb clears the floating nav plus the iOS home indicator */}
        <div className="relative z-10 pb-32">{children}</div>
        <FloatingActionButton />
        <BottomNav />
      </div>
    </ThemeProvider>
  )
}
