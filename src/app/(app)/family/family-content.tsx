'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { familyKeys, fetchFamilyMembers } from '@/lib/queries/family'
import {
  fetchFamilyInterestCards,
  interestCardKeys,
} from '@/lib/queries/interest-cards'
import {
  fetchFamilyCurrentPicks,
  fetchFamilyRecentPicks,
  pickKeys,
} from '@/lib/queries/picks'
import { groupByUser } from '@/lib/queries/group'
import { useSession } from '@/lib/supabase/session-context'
import { FamilyMemberCard } from '@/components/family-member-card'
import { PickCard } from '@/components/pick-card'
import { SectionHeader } from '@/components/ui/surface'
import { Swash } from '@/components/ui/swash'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MemberDetailView } from './member-detail-view'

/**
 * The Family tab.
 *
 * Its four reads used to run in `page.tsx` on the server, which meant every
 * visit to the tab cost a round-trip and showed `loading.tsx` first — including
 * the visit right after you backed out of a member's detail view. They now run
 * here against the React Query cache, so re-entering the tab within the cache
 * window paints immediately.
 *
 * None of them filters by `user_id`. The server version passed
 * `.in('user_id', memberIds)` using ids it had just resolved from a
 * server-verified `auth.uid()`; client-side that list is a parameter the caller
 * chooses, so it is not a boundary and keeping it would only make it look like
 * one. What actually scopes these three tables is the family-scoped SELECT
 * policies, confirmed by `supabase/verify_isolation.sql`.
 */
export function FamilyContent() {
  const { supabase, familyId, profile } = useSession()
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const familyName = profile?.families?.name || 'Family'
  const enabled = Boolean(familyId)
  const scope = familyId ?? ''

  const membersQuery = useQuery({
    queryKey: familyKeys.members(scope),
    queryFn: () => fetchFamilyMembers(supabase, scope),
    enabled,
  })

  const recentPicksQuery = useQuery({
    queryKey: pickKeys.familyRecent(scope),
    queryFn: () => fetchFamilyRecentPicks(supabase),
    enabled,
  })

  // These two preload what MemberDetailView used to fetch on mount, so tapping
  // a family member renders immediately instead of waiting on two more
  // round-trips. The grouping runs as a `select`, so it happens once per cache
  // change rather than once per render.
  const interestsQuery = useQuery({
    queryKey: interestCardKeys.family(scope),
    queryFn: () => fetchFamilyInterestCards(supabase),
    select: groupByUser,
    enabled,
  })

  const picksByMemberQuery = useQuery({
    queryKey: pickKeys.familyCurrent(scope),
    queryFn: () => fetchFamilyCurrentPicks(supabase),
    select: groupByUser,
    enabled,
  })

  const members = membersQuery.data ?? []
  const recentPicks = recentPicksQuery.data ?? []
  const interestsByMember = interestsQuery.data ?? {}
  const picksByMember = picksByMemberQuery.data ?? {}

  // Derived from the current list rather than held as its own copy of the row,
  // so an edit that lands in the cache while the detail view is open shows up,
  // and a member who left the family cannot stay on screen.
  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ?? null

  if (selectedMember) {
    return (
      <MemberDetailView
        member={selectedMember}
        interests={interestsByMember[selectedMember.id] ?? []}
        picks={picksByMember[selectedMember.id] ?? []}
        onBack={() => setSelectedMemberId(null)}
      />
    )
  }

  // Only the first uncached load. Afterwards the cached rows render straight
  // away and any refetch happens behind them.
  if (enabled && membersQuery.isPending) {
    return <FamilyContentSkeleton />
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="px-5 pb-1 pt-14">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </div>
        <h1 className="mt-1 font-display text-[30px] font-black leading-[1.06] tracking-tight text-ink">
          {familyName}
        </h1>
        <Swash profile="header" className="w-32" />
      </header>

      <SectionHeader>Everyone</SectionHeader>
      {membersQuery.isError ? (
        /* The server version had no such state: a failed query there was
           swallowed into an empty array, so a permissions or network failure
           rendered as "this family has nobody in it". */
        <div className="px-5">
          <div className="rounded-card border-card border-edge bg-card px-6 py-10 text-center backdrop-blur-card">
            <p className="font-display text-[17px] font-bold text-ink">
              Couldn&apos;t load your family
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-soft">
              Check your connection and try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => membersQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5">
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              user={member}
              /* These props existed and were never passed, so every card has
                 always read "0 interests · 0 picks" regardless of the data.
                 Pre-existing on main, not introduced by the move to the client
                 — but both maps are already in hand here for the detail view,
                 so the counts cost nothing. */
              interestCount={(interestsByMember[member.id] ?? []).length}
              pickCount={(picksByMember[member.id] ?? []).length}
              onClick={() => setSelectedMemberId(member.id)}
            />
          ))}
        </div>
      )}

      <SectionHeader>Fresh picks</SectionHeader>
      <div className="px-5">
        {recentPicks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recentPicks.map((pick) => (
              <PickCard key={pick.id} pick={pick} showUser />
            ))}
          </div>
        ) : (
          <div className="rounded-card border-card border-edge bg-card px-6 py-10 text-center backdrop-blur-card">
            <p className="font-display text-[17px] font-bold text-ink">
              Quiet last 24 hours
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-soft">
              Share a favorite from your profile to get things going.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Mirrors the layout above so the first uncached load settles into place rather
 * than jumping. `loading.tsx` still covers the navigation itself — this covers
 * the gap between the shell painting and the queries resolving, which only
 * exists now that the data is fetched in the browser.
 */
function FamilyContentSkeleton() {
  return (
    <div className="mx-auto max-w-lg">
      <header className="px-5 pb-1 pt-14">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-44" />
      </header>

      <SectionHeader>Everyone</SectionHeader>
      <div className="grid grid-cols-2 gap-3 px-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2.5 rounded-card border-card border-edge bg-card px-3 py-4 shadow-card backdrop-blur-card"
          >
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <SectionHeader>Fresh picks</SectionHeader>
      <div className="grid grid-cols-2 gap-3 px-5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2.5 h-4 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
