import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/queries'
import { ProfileContent } from './profile-content'
import type { Activity } from '@/types/database'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Both already resolved by the (app) layout.
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()

  // Three independent reads of the caller's own rows — no reason to run them
  // one after another.
  const [{ data: recentActivities }, { data: interestCards }, { data: picks }] =
    await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase.from('interest_cards').select('*').eq('user_id', user.id),

      supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .neq('value', '')
        .not('value', 'is', null),
    ])

  return (
    <ProfileContent
      user={{
        id: user.id,
        name: profile?.name || 'User',
        email: user.email || '',
        interests: profile?.interests || [],
        familyName: (profile?.families as { name: string } | null)?.name || 'Family',
        inviteCode:
          (profile?.families as { invite_code: string } | null)?.invite_code || '',
        location: profile?.location || null,
        occupation: profile?.occupation || null,
        birthday: profile?.birthday || null,
        bio: profile?.bio || null,
        phone_number: profile?.phone_number || null,
      }}
      recentActivities={(recentActivities || []) as Activity[]}
      interestCards={interestCards || []}
      picks={picks || []}
    />
  )
}
