'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export function FeedContent({ familyName, inviteCode, activities }: FeedContentProps) {
  const [view, setView] = useState<'feed' | 'calendar'>('feed')
  const router = useRouter()

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
          <div className="p-4 space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No activities yet</p>
                <p className="text-gray-400 mt-1">
                  Be the first to share what you&apos;re up to!
                </p>
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
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
