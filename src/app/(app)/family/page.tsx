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

  // The picks query used to be built from the member ids returned by the members
  // query, which forced it to wait. It does not actually need them: the
  // "Users can view family picks" policy already restricts picks to the caller's
  // own family, so `.in('user_id', memberIds)` was re-stating a constraint the
  // database enforces regardless. Same for the two detail queries below. All
  // four now go out at once.
  //
  // The last two preload what MemberDetailView used to fetch on mount, so
  // tapping a family member renders immediately instead of showing a skeleton
  // while two more round-trips happen. A family is a handful of people, so
  // fetching everyone's cards up front costs less than one round-trip per tap.
  const [
    { data: members },
    { data: recentPicks },
    { data: allInterests },
    { data: allCurrentPicks },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('family_id', familyId).order('name'),

    supabase
      .from('picks')
      .select('*, users(name, avatar_url)')
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase.from('interest_cards').select('*'),

    supabase.from('picks').select('*').eq('is_current', true),
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
