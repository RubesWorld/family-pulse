'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, isToday, isYesterday } from 'date-fns'
import { activityKeys, fetchFamilyActivities } from '@/lib/queries/activities'
import {
  fetchFamilyPicksSinceWithPrevious,
  pickKeys,
} from '@/lib/queries/picks'
import { useSession } from '@/lib/supabase/session-context'
import { ActivityCard } from '@/components/activity-card'
import { PickActivityCard } from '@/components/pick-activity-card'
import { CalendarView } from '@/components/calendar-view'
import { FeedHeader, FeedFilter } from './feed-header'
import { SectionHeader } from '@/components/ui/surface'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { ActivityWithUser, PickWithUser } from '@/types/database'

type FeedItem =
  | { type: 'activity'; data: ActivityWithUser }
  | { type: 'pick'; data: PickWithUser }

function groupFeedItemsByDate(activities: ActivityWithUser[], picks: PickWithUser[]) {
  const grouped = new Map<string, FeedItem[]>()

  activities.forEach((activity) => {
    const dateKey = format(new Date(activity.created_at), 'yyyy-MM-dd')
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push({ type: 'activity', data: activity })
  })

  picks.forEach((pick) => {
    const dateKey = format(new Date(pick.created_at), 'yyyy-MM-dd')
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push({ type: 'pick', data: pick })
  })

  return Array.from(grouped.entries())
    .map(([dateKey, items]) => ({
      dateKey,
      date: new Date(dateKey),
      items: items.sort(
        (a, b) =>
          new Date(b.data.created_at).getTime() -
          new Date(a.data.created_at).getTime()
      ),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

function formatDateHeader(date: Date): string {
  if (isToday(date)) return `Today · ${format(date, 'EEEE')}`
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

/** The feed shows picks changed in the last day. */
const PICK_WINDOW_HOURS = 24

/**
 * The start of the pick window, floored to the hour.
 *
 * The boundary is part of the query key, so an exact `now - 24h` would mint a
 * new key on every render and the cache would never hit. Flooring makes the key
 * change at most once an hour; the cost is that the window is 24–25 hours wide
 * rather than exactly 24, which on a family feed is not a difference anyone can
 * see.
 */
function pickWindowStart(now: Date): string {
  const start = new Date(now)
  start.setHours(start.getHours() - PICK_WINDOW_HOURS, 0, 0, 0)
  return start.toISOString()
}

/**
 * The Feed tab.
 *
 * Its two reads and the previous-value annotation used to run in `page.tsx`, so
 * every visit — including coming back from the add form or from another tab —
 * cost a server round-trip and showed `loading.tsx` first.
 *
 * Neither query filters by `user_id`. The server version passed
 * `.in('user_id', memberIds)` from ids it had resolved server-side; in the
 * browser that list is a parameter the caller chooses, so it scopes nothing. The
 * family-scoped SELECT policies on `activities` and `picks` are what restrict
 * these rows, confirmed by `supabase/verify_isolation.sql`.
 */
export function FeedContent() {
  const { supabase, familyId, profile } = useSession()
  const [view, setView] = useState<'feed' | 'calendar'>('feed')
  const [filter, setFilter] = useState<FeedFilter>('all')

  const familyName = profile?.families?.name || 'Family'
  const inviteCode = profile?.families?.invite_code || ''
  const enabled = Boolean(familyId)
  const scope = familyId ?? ''

  // Recomputed per render, but it only changes value on the hour, so the key is
  // stable for as long as the window is.
  const windowStart = pickWindowStart(new Date())

  const activitiesQuery = useQuery({
    queryKey: activityKeys.family(scope),
    queryFn: () => fetchFamilyActivities(supabase),
    enabled,
  })

  const picksQuery = useQuery({
    queryKey: pickKeys.familyLatest(scope, windowStart),
    queryFn: () => fetchFamilyPicksSinceWithPrevious(supabase, windowStart),
    enabled,
  })

  const activities = useMemo(
    () => activitiesQuery.data ?? [],
    [activitiesQuery.data]
  )
  const recentPicks = useMemo(
    () => (picksQuery.data ?? []) as PickWithUser[],
    [picksQuery.data]
  )

  const groupedItems = useMemo(
    () => groupFeedItemsByDate(activities, recentPicks),
    [activities, recentPicks]
  )

  const filteredGroupedItems = useMemo(() => {
    if (filter === 'all') return groupedItems

    return groupedItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          filter === 'activities'
            ? item.type === 'activity'
            : item.type === 'pick'
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [groupedItems, filter])

  const hasContent = activities.length > 0 || recentPicks.length > 0
  const hasFilteredContent = filteredGroupedItems.length > 0

  // Only the first uncached load. Afterwards the cached rows render straight
  // away and any refetch happens behind them.
  const isFirstLoad =
    enabled && (activitiesQuery.isPending || picksQuery.isPending)
  const isError = activitiesQuery.isError || picksQuery.isError

  const emptyMessage = (() => {
    if (!hasContent) {
      return {
        emoji: '🌱',
        title: 'Nothing here yet',
        subtitle: "Be the first to share what you're up to.",
      }
    }
    if (filter === 'activities') {
      return {
        emoji: '📭',
        title: 'No activities',
        subtitle: 'Try switching to All, or add something you’re doing.',
      }
    }
    if (filter === 'picks') {
      return {
        emoji: '💭',
        title: 'No picks',
        subtitle: 'Try switching to All, or add your favorites in your profile.',
      }
    }
    return {
      emoji: '🍂',
      title: 'Nothing to show',
      subtitle: 'Try a different filter.',
    }
  })()

  return (
    <div className="mx-auto max-w-lg">
      <FeedHeader
        familyName={familyName}
        inviteCode={inviteCode}
        view={view}
        onViewChange={setView}
        filter={filter}
        onFilterChange={setFilter}
      />

      {isFirstLoad ? (
        <FeedSkeleton />
      ) : isError ? (
        /* The server version had no such state: a failed query there fell
           through to `data: undefined`, so a permissions or network failure
           rendered as "nothing here yet". */
        <div className="px-5 pt-4">
          <div className="rounded-card border-card border-edge bg-card px-6 py-10 text-center backdrop-blur-card">
            <p className="font-display text-[17px] font-bold text-ink">
              Couldn&apos;t load the feed
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-soft">
              Check your connection and try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                void activitiesQuery.refetch()
                void picksQuery.refetch()
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : view === 'feed' ? (
        !hasFilteredContent ? (
          <div className="px-8 py-20 text-center">
            <div className="text-4xl">{emptyMessage.emoji}</div>
            <p className="mt-4 font-display text-xl font-bold text-ink">
              {emptyMessage.title}
            </p>
            <p className="mt-1.5 text-[13.5px] font-medium text-ink-soft">
              {emptyMessage.subtitle}
            </p>
          </div>
        ) : (
          filteredGroupedItems.map((group) => (
            <section key={group.dateKey}>
              <SectionHeader>{formatDateHeader(group.date)}</SectionHeader>
              <div className="flex flex-col gap-3.5 px-5">
                {group.items.map((item, i) =>
                  item.type === 'activity' ? (
                    <ActivityCard
                      key={item.data.id}
                      activity={item.data}
                      tilt={i % 2 === 0 ? 'a' : 'b'}
                    />
                  ) : (
                    <PickActivityCard
                      key={item.data.id}
                      pick={item.data}
                      tilt={i % 2 === 0 ? 'a' : 'b'}
                    />
                  )
                )}
              </div>
            </section>
          ))
        )
      ) : (
        <CalendarView activities={activities} />
      )}
    </div>
  )
}

/**
 * Covers the gap between the shell painting and the queries resolving — a gap
 * that only exists now that the reads happen in the browser. `loading.tsx`
 * still covers the navigation itself.
 */
function FeedSkeleton() {
  return (
    <>
      {[0, 1].map((group) => (
        <section key={group}>
          {/* Matches SectionHeader's spacing without nesting a block element
              inside its <h2>. */}
          <div className="px-5 pb-2.5 pt-5">
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="flex flex-col gap-3.5 px-5">
            {[0, 1].map((card) => (
              <div
                key={card}
                className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
