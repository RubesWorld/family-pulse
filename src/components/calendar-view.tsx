'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityWithUser } from '@/types/database'

interface CalendarViewProps {
  activities: ActivityWithUser[]
}

function groupActivitiesByDate(activities: ActivityWithUser[]) {
  const grouped = new Map<string, ActivityWithUser[]>()

  activities.forEach((activity) => {
    if (!activity.starts_at) return
    const dateKey = format(new Date(activity.starts_at), 'yyyy-MM-dd')
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(activity)
  })

  return grouped
}

export function CalendarView({ activities }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const router = useRouter()

  const activitiesByDate = useMemo(
    () => groupActivitiesByDate(activities),
    [activities]
  )

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    router.push(`/add?date=${dateStr}`)
  }

  const scheduledCount = activities.filter((a) => a.starts_at).length

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousMonth}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Activity Count */}
      {scheduledCount > 0 && (
        <p className="text-sm text-gray-600 text-center mb-4">
          {scheduledCount} scheduled {scheduledCount === 1 ? 'activity' : 'activities'}
        </p>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayActivities = activitiesByDate.get(dateKey) || []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isCurrentDay = isToday(day)

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  relative min-h-[60px] p-2 border-r border-b border-gray-100
                  hover:bg-blue-50 transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'text-gray-900'}
                  ${isCurrentDay ? 'bg-blue-50 font-semibold' : ''}
                  ${index % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                <div className="text-sm">
                  {format(day, 'd')}
                </div>

                {/* Activity Dots */}
                {dayActivities.length > 0 && (
                  <div className="flex gap-1 justify-center mt-1">
                    {dayActivities.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      />
                    ))}
                    {dayActivities.length > 3 && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        +{dayActivities.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {scheduledCount === 0 && (
        <p className="text-center text-gray-500 text-sm mt-6">
          No activities scheduled. Click a day to add one!
        </p>
      )}
    </div>
  )
}
