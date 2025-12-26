'use client'

import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Calendar } from 'lucide-react'
import { ActivityWithUser } from '@/types/database'

interface ActivityCardProps {
  activity: ActivityWithUser
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatActivityTime(date: string | null): string | null {
  if (!date) return null

  const d = new Date(date)

  if (isToday(d)) {
    return `Today at ${format(d, 'h:mm a')}`
  }
  if (isTomorrow(d)) {
    return `Tomorrow at ${format(d, 'h:mm a')}`
  }
  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'h:mm a')}`
  }

  return format(d, 'EEE, MMM d \'at\' h:mm a')
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
  const activityTime = formatActivityTime(activity.starts_at)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
              {getInitials(activity.users?.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-gray-900 truncate">
                {activity.users?.name}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {timeAgo}
              </span>
            </div>
            <h3 className="font-medium text-gray-900 mt-1">
              {activity.title}
            </h3>
            {activity.description && (
              <p className="text-gray-600 mt-1 text-sm">
                {activity.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {activityTime && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{activityTime}</span>
                </div>
              )}
              {activity.location_name && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activity.location_name}</span>
                </div>
              )}
            </div>
            {activity.notes && (
              <p className="text-sm text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">
                {activity.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
