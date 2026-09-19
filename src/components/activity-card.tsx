'use client'

import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { MapPin, Calendar, MessageCircle } from 'lucide-react'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { MetaChip, NoteCallout, Surface } from '@/components/ui/surface'
import { ActivityWithUser } from '@/types/database'
import { openSMS } from '@/lib/sms'
import { useI18n } from '@/components/i18n-provider'
import { t, type Dictionary } from '@/lib/i18n'
import type { Locale as DateFnsLocale } from 'date-fns'

interface ActivityCardProps {
  activity: ActivityWithUser
  tilt?: 'a' | 'b'
}

function formatActivityTime(
  date: string | null,
  dict: Dictionary,
  dateLocale: DateFnsLocale
): string | null {
  if (!date) return null

  const d = new Date(date)
  const time = format(d, 'p', { locale: dateLocale })

  if (isToday(d)) return t(dict.feed.todayAt, { time })
  if (isTomorrow(d)) return t(dict.feed.tomorrowAt, { time })
  if (isYesterday(d)) return t(dict.feed.yesterdayAt, { time })

  return (
    format(d, dict.feed.dateFormatShort, { locale: dateLocale }) + ' · ' + time
  )
}

export function ActivityCard({ activity, tilt }: ActivityCardProps) {
  const { dict, dateLocale } = useI18n()
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
    locale: dateLocale,
  })
  const activityTime = formatActivityTime(activity.starts_at, dict, dateLocale)

  const handleTextClick = () => {
    if (!activity.users?.phone_number) return

    const message = `Hey ${activity.users.name}, about "${activity.title}"...`
    openSMS(activity.users.phone_number, message)
  }

  return (
    <Surface tilt={tilt}>
      <div className="flex gap-3">
        <GlowAvatar
          name={activity.users?.name}
          userId={activity.user_id}
          avatarUrl={activity.users?.avatar_url}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="truncate text-[14.5px] font-extrabold text-ink">
              {activity.users?.name}
            </span>
            <time className="flex-none text-[11.5px] font-bold text-ink-faint">
              {timeAgo}
            </time>
          </div>

          <h3 className="mt-1 font-display text-[19px] font-bold leading-snug tracking-tight text-ink">
            {activity.title}
          </h3>

          {activity.description && (
            <p className="mt-1 text-[13.5px] font-medium leading-relaxed text-ink-soft">
              {activity.description}
            </p>
          )}

          {(activityTime || activity.location_name) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {activityTime && <MetaChip icon={Calendar}>{activityTime}</MetaChip>}
              {activity.location_name && (
                <MetaChip icon={MapPin}>{activity.location_name}</MetaChip>
              )}
            </div>
          )}

          {activity.notes && (
            <NoteCallout className="mt-2.5">{activity.notes}</NoteCallout>
          )}

          {activity.users?.phone_number && (
            <button
              type="button"
              onClick={handleTextClick}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-coral to-marigold px-4 py-2.5 text-[12.5px] font-extrabold text-on-ink transition-transform active:scale-95"
              style={{
                boxShadow:
                  '0 8px 24px -6px hsl(var(--coral) / calc(0.9 * var(--glow))), inset 0 1px 0 rgb(255 255 255 / 0.45)',
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {t(dict.family.textPerson, {
                name: activity.users.name.split(' ')[0],
              })}
            </button>
          )}
        </div>
      </div>
    </Surface>
  )
}
