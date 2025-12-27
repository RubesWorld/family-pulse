import { createClient } from '@/lib/supabase/server'
import { ActivityWithUser, PickWithUser } from '@/types/database'
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

  // Get all family members
  const { data: familyMembers } = await supabase
    .from('users')
    .select('id')
    .eq('family_id', profile?.family_id || '')

  const familyMemberIds = familyMembers?.map(m => m.id) || []

  // Get all activities from family members
  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      users (name, avatar_url, phone_number)
    `)
    .order('created_at', { ascending: false })

  // Get recent picks from family members (last 24 hours)
  const last24Hours = new Date()
  last24Hours.setHours(last24Hours.getHours() - 24)

  const { data: recentPicks } = await supabase
    .from('picks')
    .select(`
      *,
      users (name, avatar_url)
    `)
    .in('user_id', familyMemberIds)
    .gte('created_at', last24Hours.toISOString())
    .order('created_at', { ascending: false })

  const typedActivities = (activities || []) as ActivityWithUser[]
  const typedPicks = (recentPicks || []) as PickWithUser[]

  return (
    <FeedContent
      familyName={(profile?.families as { name: string } | null)?.name || 'Family'}
      inviteCode={(profile?.families as { invite_code: string } | null)?.invite_code || ''}
      activities={typedActivities}
      recentPicks={typedPicks}
    />
  )
}
