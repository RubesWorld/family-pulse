import { createClient } from '@/lib/supabase/server'
import { ActivityCard } from '@/components/activity-card'
import { ActivityWithUser } from '@/types/database'
import { FeedHeader } from './feed-header'

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
    <div className="max-w-lg mx-auto">
      <FeedHeader
        familyName={(profile?.families as { name: string } | null)?.name || 'Family'}
        inviteCode={(profile?.families as { invite_code: string } | null)?.invite_code || ''}
      />

      <div className="p-4 space-y-4">
        {typedActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No activities yet</p>
            <p className="text-gray-400 mt-1">
              Be the first to share what you&apos;re up to!
            </p>
          </div>
        ) : (
          typedActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  )
}
