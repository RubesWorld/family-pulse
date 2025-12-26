import { createClient } from '@/lib/supabase/server'
import { ActivityWithUser } from '@/types/database'
import { FeedContent } from './feed-content'

export default async function FeedPage() {
  const supabase = await createClient()

  // Get current user's family
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('family_id, families(name, invite_code)')
    .eq('id', user?.id || '')
    .single()

  // Get all activities from family members
  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      users (name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  const typedActivities = (activities || []) as ActivityWithUser[]

  return (
    <FeedContent
      familyName={(profile?.families as { name: string } | null)?.name || 'Family'}
      inviteCode={(profile?.families as { invite_code: string } | null)?.invite_code || ''}
      activities={typedActivities}
    />
  )
}
