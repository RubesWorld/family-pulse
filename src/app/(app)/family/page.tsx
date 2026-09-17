import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'
import { FamilyContent } from './family-content'

export default async function FamilyPage() {
  const supabase = await createClient()

  // Resolved by the (app) layout already.
  const profile = await getCurrentProfile()
  const familyId = profile?.family_id

  if (!familyId) {
    return (
      <FamilyContent
        familyName="Family"
        members={[]}
        recentPicks={[]}
        interestsByMember={{}}
        picksByMember={{}}
      />
    )
  }

  const { data: members } = await supabase
    .from('users')
    .select('*')
    .eq('family_id', familyId)
    .order('name')

  const memberIds = (members ?? []).map((m) => m.id)

  if (memberIds.length === 0) {
    return (
      <FamilyContent
        familyName={(profile?.families as { name: string } | null)?.name || 'Family'}
        members={[]}
        recentPicks={[]}
        interestsByMember={{}}
        picksByMember={{}}
      />
    )
  }

  // Every query below is scoped to memberIds explicitly, even though the
  // "Users can view family picks" / "...family interest cards" policies are
  // supposed to enforce the same thing.
  //
  // That redundancy is deliberate. Production's RLS has drifted from
  // supabase/migrations and is known to differ from it; at the time of writing we
  // had confirmed the `users` policy cannot be enforced as written but had not
  // confirmed which tables actually have RLS switched on. Leaning on a policy
  // whose enforcement we cannot vouch for is how one family ends up seeing
  // another's data. An explicit filter costs one extra round-trip for the member
  // list, which is now single-digit milliseconds since functions run in the same
  // region as the database.
  //
  // The last two preload what MemberDetailView used to fetch on mount, so tapping
  // a family member renders immediately instead of waiting on two more
  // round-trips. A family is a handful of people, so fetching everyone's cards up
  // front costs less than one round-trip per tap.
  const [{ data: recentPicks }, { data: allInterests }, { data: allCurrentPicks }] =
    await Promise.all([
      supabase
        .from('picks')
        .select('*, users(name, avatar_url)')
        .in('user_id', memberIds)
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(10),

      supabase.from('interest_cards').select('*').in('user_id', memberIds),

      supabase
        .from('picks')
        .select('*')
        .in('user_id', memberIds)
        .eq('is_current', true),
    ])

  return (
    <FamilyContent
      familyName={(profile?.families as { name: string } | null)?.name || 'Family'}
      members={members || []}
      recentPicks={recentPicks || []}
      interestsByMember={groupByUser(allInterests)}
      picksByMember={groupByUser(allCurrentPicks)}
    />
  )
}

function groupByUser<T extends { user_id: string }>(
  rows: T[] | null
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  for (const row of rows ?? []) {
    ;(grouped[row.user_id] ??= []).push(row)
  }
  return grouped
}
