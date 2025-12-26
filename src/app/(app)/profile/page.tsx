import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from './profile-content'
import type { Activity } from '@/types/database'

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

  // Fetch recent activities
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <ProfileContent
      user={{
        id: user.id,
        name: profile?.name || 'User',
        email: user.email || '',
        interests: profile?.interests || [],
        familyName: (profile?.families as { name: string } | null)?.name || 'Family',
        inviteCode: (profile?.families as { invite_code: string } | null)?.invite_code || '',
      }}
      recentActivities={(recentActivities || []) as Activity[]}
    />
  )
}
