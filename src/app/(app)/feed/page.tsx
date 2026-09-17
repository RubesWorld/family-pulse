import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, getFamilyMemberIds } from '@/lib/supabase/queries'
import { ActivityWithUser, PickWithUser } from '@/types/database'
import { FeedContent } from './feed-content'

/**
 * How many activities the feed loads. Previously this query had no limit at
 * all, so it returned every activity the family had ever created and the cost
 * grew without bound as the app aged.
 */
const FEED_ACTIVITY_LIMIT = 100

export default async function FeedPage() {
  const supabase = await createClient()

  // Already resolved by the (app) layout — free here.
  const profile = await getCurrentProfile()
  const familyId = profile?.family_id

  if (!familyId) {
    return (
      <FeedContent
        familyName="Family"
        inviteCode=""
        activities={[]}
        recentPicks={[]}
      />
    )
  }

  const familyMemberIds = await getFamilyMemberIds(familyId)

  const last24Hours = new Date()
  last24Hours.setHours(last24Hours.getHours() - 24)

  // These two do not depend on each other, so they go out together instead of
  // one waiting on the other.
  const [{ data: activities }, { data: recentPicks }] = await Promise.all([
    supabase
      .from('activities')
      .select(`*, users (name, avatar_url, phone_number)`)
      .in('user_id', familyMemberIds)
      .order('created_at', { ascending: false })
      .limit(FEED_ACTIVITY_LIMIT),

    supabase
      .from('picks')
      .select(`*, users (name, avatar_url)`)
      .in('user_id', familyMemberIds)
      .eq('is_current', true)
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false }),
  ])

  const picksWithHistory = await attachPreviousValues(
    supabase,
    recentPicks ?? []
  )

  const typedActivities = (activities || []) as ActivityWithUser[]
  const typedPicks = picksWithHistory as (PickWithUser & {
    previous_value: string | null
  })[]

  return (
    <FeedContent
      familyName={(profile?.families as { name: string } | null)?.name || 'Family'}
      inviteCode={
        (profile?.families as { invite_code: string } | null)?.invite_code || ''
      }
      activities={typedActivities}
      recentPicks={typedPicks}
    />
  )
}

/**
 * Annotate each pick with the value it replaced, so the feed can show
 * "changed from X to Y".
 *
 * This used to be a `Promise.all` over a per-pick query. `Promise.all` made
 * those concurrent but not fewer — it was still one round-trip and one full RLS
 * evaluation per pick on the feed. One query covering every (user, category)
 * pair in play replaces all of them; the most recent archived row per pair wins.
 */
async function attachPreviousValues<
  T extends { user_id: string; category: string },
>(supabase: Awaited<ReturnType<typeof createClient>>, picks: T[]) {
  if (picks.length === 0) return []

  const userIds = Array.from(new Set(picks.map((p) => p.user_id)))
  const categories = Array.from(new Set(picks.map((p) => p.category)))

  const { data: archived } = await supabase
    .from('picks')
    .select('user_id, category, value, archived_at')
    .in('user_id', userIds)
    .in('category', categories)
    .eq('is_current', false)
    .order('archived_at', { ascending: false })

  // Ordered newest-first, so the first row seen for a pair is the one we want.
  const mostRecent = new Map<string, string>()
  for (const row of archived ?? []) {
    const key = `${row.user_id}:${row.category}`
    if (!mostRecent.has(key)) {
      mostRecent.set(key, row.value)
    }
  }

  return picks.map((pick) => ({
    ...pick,
    previous_value: mostRecent.get(`${pick.user_id}:${pick.category}`) ?? null,
  }))
}
