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
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityCard } from '@/components/activity-card'
import { SectionHeader } from '@/components/ui/surface'
import { useTheme } from '@/components/theme-provider'
import { personAccent } from '@/lib/person-color'
import { cn } from '@/lib/utils'
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView({ activities }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const router = useRouter()
  const { accents } = useTheme()

  const activitiesByDate = useMemo(
    () => groupActivitiesByDate(activities),
    [activities]
  )

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    })
  }, [currentMonth])

  const scheduledCount = activities.filter((a) => a.starts_at).length
  const selectedDayActivities = selectedDate
    ? activitiesByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : []

  return (
    <div className="mx-auto max-w-lg px-5 pt-4">
      {/* month nav */}
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-display text-lg font-black text-ink">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {scheduledCount > 0 && (
        <p className="mb-3 text-center text-[12px] font-bold text-ink-soft">
          {scheduledCount} scheduled{' '}
          {scheduledCount === 1 ? 'activity' : 'activities'}
        </p>
      )}

      {/* grid */}
      <div className="overflow-hidden rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
        <div className="grid grid-cols-7 border-b border-edge">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-ink-faint"
            >
              {day.slice(0, 1)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayActivities =
              activitiesByDate.get(format(day, 'yyyy-MM-dd')) || []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isCurrentDay = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedDate(day)}
                aria-label={format(day, 'EEEE, MMMM d')}
                aria-pressed={!!isSelected}
                className={cn(
                  'relative min-h-[58px] border-b border-r border-edge p-1.5 transition-colors',
                  index % 7 === 6 && 'border-r-0',
                  isCurrentMonth ? 'text-ink' : 'text-ink-faint opacity-50',
                  isCurrentDay && 'bg-marigold/[0.12] font-black',
                  isSelected && 'bg-coral/[0.18]'
                )}
              >
                <span
                  className={cn(
                    'text-[13px] font-bold',
                    isCurrentDay && 'text-marigold'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {dayActivities.length > 0 && (
                  <span className="mt-1 flex items-center justify-center gap-0.5">
                    {dayActivities.slice(0, 3).map((activity) => (
                      <span
                        key={activity.id}
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{
                          background: accents[personAccent(activity.user_id)],
                        }}
                      />
                    ))}
                    {dayActivities.length > 3 && (
                      <span className="text-[9px] font-extrabold text-ink-faint">
                        +{dayActivities.length - 3}
                      </span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* selected day */}
      {selectedDate && (
        <section className="mt-2">
          <SectionHeader
            className="px-0"
            action={
              <Button
                size="sm"
                onClick={() =>
                  router.push(`/add?date=${format(selectedDate, 'yyyy-MM-dd')}`)
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            }
          >
            {format(selectedDate, 'EEE, MMM d')}
          </SectionHeader>

          {selectedDayActivities.length === 0 ? (
            <p className="py-8 text-center text-[13px] font-semibold text-ink-soft">
              Nothing scheduled for this day.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {selectedDayActivities.map((activity, i) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  tilt={i % 2 === 0 ? 'a' : 'b'}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {scheduledCount === 0 && !selectedDate && (
        <p className="mt-6 text-center text-[13px] font-semibold text-ink-soft">
          Nothing scheduled yet. Tap a day to add something.
        </p>
      )}
    </div>
  )
}
