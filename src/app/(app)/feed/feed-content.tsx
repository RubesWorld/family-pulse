'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday } from 'date-fns'
import { ActivityCard } from '@/components/activity-card'
import { CalendarView } from '@/components/calendar-view'
import { FeedHeader } from './feed-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { ActivityWithUser } from '@/types/database'

interface FeedContentProps {
  familyName: string
  inviteCode: string
  activities: ActivityWithUser[]
}

function groupActivitiesByDate(activities: ActivityWithUser[]) {
  const grouped = new Map<string, ActivityWithUser[]>()

  activities.forEach((activity) => {
    const date = new Date(activity.created_at)
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(activity)
  })

  return Array.from(grouped.entries()).map(([dateKey, activities]) => ({
    dateKey,
    date: new Date(dateKey),
    activities,
  }))
}

function formatDateHeader(date: Date): string {
  if (isToday(date)) {
    return 'Today'
  }
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  return format(date, 'EEEE, MMMM d, yyyy')
}

export function FeedContent({ familyName, inviteCode, activities }: FeedContentProps) {
  const [view, setView] = useState<'feed' | 'calendar'>('feed')
  const router = useRouter()

  const groupedActivities = useMemo(
    () => groupActivitiesByDate(activities),
    [activities]
  )

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
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No activities yet</p>
                <p className="text-gray-400 mt-1">
                  Be the first to share what you&apos;re up to!
                </p>
              </div>
            ) : (
              groupedActivities.map((group) => (
                <div key={group.dateKey} className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 px-1">
                    {formatDateHeader(group.date)}
                  </h2>
                  <div className="space-y-4">
                    {group.activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
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
