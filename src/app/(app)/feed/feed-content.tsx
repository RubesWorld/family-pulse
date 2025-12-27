'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday } from 'date-fns'
import { ActivityCard } from '@/components/activity-card'
import { PickActivityCard } from '@/components/pick-activity-card'
import { CalendarView } from '@/components/calendar-view'
import { FeedHeader } from './feed-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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

  // Add activities
  activities.forEach((activity) => {
    const date = new Date(activity.created_at)
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push({ type: 'activity', data: activity })
  })

  // Add picks
  picks.forEach((pick) => {
    const date = new Date(pick.created_at)
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push({ type: 'pick', data: pick })
  })

  // Sort items within each day by created_at (newest first)
  return Array.from(grouped.entries())
    .map(([dateKey, items]) => ({
      dateKey,
      date: new Date(dateKey),
      items: items.sort((a, b) => {
        const dateA = new Date(a.data.created_at)
        const dateB = new Date(b.data.created_at)
        return dateB.getTime() - dateA.getTime()
      }),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort groups by date (newest first)
}

function formatDateHeader(date: Date): string {
  const fullDate = format(date, 'EEEE, MMMM d, yyyy')

  if (isToday(date)) {
    return `Today, ${format(date, 'MMMM d, yyyy')}`
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'MMMM d, yyyy')}`
  }
  return fullDate
}

export function FeedContent({ familyName, inviteCode, activities, recentPicks }: FeedContentProps) {
  const [view, setView] = useState<'feed' | 'calendar'>('feed')
  const router = useRouter()

  const groupedItems = useMemo(
    () => groupFeedItemsByDate(activities, recentPicks),
    [activities, recentPicks]
  )

  const hasContent = activities.length > 0 || recentPicks.length > 0

  return (
    <div className="max-w-lg mx-auto">
      <FeedHeader
        familyName={familyName}
        inviteCode={inviteCode}
        view={view}
        onViewChange={setView}
      />

      {view === 'feed' ? (
        <>
          <div className="p-4 space-y-6">
            {!hasContent ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No activities yet</p>
                <p className="text-gray-400 mt-1">
                  Be the first to share what you&apos;re up to!
                </p>
              </div>
            ) : (
              groupedItems.map((group) => (
                <div key={group.dateKey} className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 px-1">
                    {formatDateHeader(group.date)}
                  </h2>
                  <div className="space-y-4">
                    {group.items.map((item) =>
                      item.type === 'activity' ? (
                        <ActivityCard key={item.data.id} activity={item.data} />
                      ) : (
                        <PickActivityCard key={item.data.id} pick={item.data} />
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Fixed Add Button for Feed View */}
          <div className="fixed bottom-6 right-6">
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 w-14 p-0"
              onClick={() => router.push('/add')}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </>
      ) : (
        <CalendarView activities={activities} />
      )}
    </div>
  )
}
