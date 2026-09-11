'use client'

import { useState, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { ActivityCard } from '@/components/activity-card'
import { PickActivityCard } from '@/components/pick-activity-card'
import { CalendarView } from '@/components/calendar-view'
import { FeedHeader, FeedFilter } from './feed-header'
import { SectionHeader } from '@/components/ui/surface'
import type { ActivityWithUser, PickWithUser } from '@/types/database'

interface FeedContentProps {
  familyName: string
  inviteCode: string
  activities: ActivityWithUser[]
  recentPicks: PickWithUser[]
}

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

export function FeedContent({
  familyName,
  inviteCode,
  activities,
  recentPicks,
}: FeedContentProps) {
  const [view, setView] = useState<'feed' | 'calendar'>('feed')
  const [filter, setFilter] = useState<FeedFilter>('all')

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

      {view === 'feed' ? (
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
