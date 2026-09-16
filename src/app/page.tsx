import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/queries'

export default async function Home() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()

  if (profile?.family_id) {
    redirect('/feed')
  } else {
    redirect('/create-family')
  }
}
