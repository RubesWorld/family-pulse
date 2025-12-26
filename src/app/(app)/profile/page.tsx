import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from './profile-content'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, families(name, invite_code)')
    .eq('id', user.id)
    .single()

  return (
    <ProfileContent
      user={{
        name: profile?.name || 'User',
        email: user.email || '',
        familyName: (profile?.families as { name: string } | null)?.name || 'Family',
        inviteCode: (profile?.families as { invite_code: string } | null)?.invite_code || '',
      }}
    />
  )
}
