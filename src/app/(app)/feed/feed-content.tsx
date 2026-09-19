'use client'

import { useState, useMemo } from 'react'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import { ActivityCard } from '@/components/activity-card'
import { PickActivityCard } from '@/components/pick-activity-card'
import { CalendarView } from '@/components/calendar-view'
import { FeedHeader, FeedFilter } from './feed-header'
import { SectionHeader } from '@/components/ui/surface'
import { PromptCard } from '@/components/picks/prompt-card'
import {
  WeeklyQuestionCard,
  YourTurnToAskCard,
} from '@/components/feed/weekly-question-card'
import { QuestionAnswerCard } from '@/components/feed/question-answer-card'
import { useI18n } from '@/components/i18n-provider'
import type { Dictionary } from '@/lib/i18n'
import type { Locale as DateFnsLocale } from 'date-fns'
import type {
  ActivityWithUser,
  AnswerWithUser,
  PickWithUser,
  QuestionWithAnswers,
} from '@/types/database'

interface FeedContentProps {
  familyName: string
  inviteCode: string
  activities: ActivityWithUser[]
  recentPicks: PickWithUser[]
  currentUserId: string
  /** One unanswered prompt, chosen server-side. Null when there are none left. */
  openPromptId: string | null
  /** This week's question, so its answers can flow through the feed. */
  weeklyQuestion: QuestionWithAnswers | null
  familyMemberCount: number
}

type FeedItem =
  | { type: 'activity'; data: ActivityWithUser }
  | { type: 'pick'; data: PickWithUser }
  | { type: 'answer'; data: AnswerWithUser; questionText: string }

function groupFeedItemsByDate(
  activities: ActivityWithUser[],
  picks: PickWithUser[],
  answers: AnswerWithUser[],
  questionText: string
) {
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

  answers.forEach((answer) => {
    const dateKey = format(new Date(answer.created_at), 'yyyy-MM-dd')
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push({ type: 'answer', data: answer, questionText })
  })

  return Array.from(grouped.entries())
    .map(([dateKey, items]) => ({
      dateKey,
      // startOfDay on a real timestamp, NOT new Date(dateKey). Parsing
      // "2026-09-19" yields UTC midnight, which is the previous evening
      // anywhere west of UTC — so every header read a day early.
      date: startOfDay(new Date(items[0].data.created_at)),
      items: items.sort(
        (a, b) =>
          new Date(b.data.created_at).getTime() -
          new Date(a.data.created_at).getTime()
      ),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

function formatDateHeader(
  date: Date,
  dict: Dictionary,
  dateLocale: DateFnsLocale
): string {
  if (isToday(date)) {
    return `${dict.feed.today} · ${format(date, 'EEEE', { locale: dateLocale })}`
  }
  if (isYesterday(date)) return dict.feed.yesterday
  return format(date, dict.feed.dateFormatLong, { locale: dateLocale })
}

export function FeedContent({
  familyName,
  inviteCode,
  activities,
  recentPicks,
  currentUserId,
  openPromptId,
  weeklyQuestion,
  familyMemberCount,
}: FeedContentProps) {
  const { dict, dateLocale } = useI18n()
  const [view, setView] = useState<'feed' | 'calendar'>('feed')
  const [filter, setFilter] = useState<FeedFilter>('all')

  const currentAnswers = useMemo(
    () =>
      (weeklyQuestion?.question_answers ?? []).filter((a) => a.is_current),
    [weeklyQuestion]
  )

  const groupedItems = useMemo(
    () =>
      groupFeedItemsByDate(
        activities,
        recentPicks,
        weeklyQuestion?.status === 'active' ? currentAnswers : [],
        weeklyQuestion?.question_text ?? ''
      ),
    [activities, recentPicks, currentAnswers, weeklyQuestion]
  )

  const filteredGroupedItems = useMemo(() => {
    if (filter === 'all') return groupedItems

    return groupedItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          filter === 'activities'
            ? item.type === 'activity'
            : item.type !== 'activity'
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [groupedItems, filter])

  const hasContent =
    activities.length > 0 || recentPicks.length > 0 || currentAnswers.length > 0
  const hasFilteredContent = filteredGroupedItems.length > 0

  const emptyMessage = (() => {
    if (!hasContent) {
      return {
        emoji: '🌱',
        title: dict.feed.emptyTitle,
        subtitle: dict.feed.emptyHint,
      }
    }
    if (filter === 'activities') {
      return {
        emoji: '📭',
        title: dict.feed.emptyActivitiesTitle,
        subtitle: dict.feed.emptyActivitiesHint,
      }
    }
    if (filter === 'picks') {
      return {
        emoji: '💭',
        title: dict.feed.emptyAnswersTitle,
        subtitle: dict.feed.emptyAnswersHint,
      }
    }
    return {
      emoji: '🍂',
      title: dict.feed.emptyTitle,
      subtitle: dict.feed.emptyHint,
    }
  })()

  // Only ever one ask on screen. Choosing this week's question outranks
  // answering it, which outranks an interest prompt.
  const myAnswer = currentAnswers.find((a) => a.user_id === currentUserId)
  const isMyTurnToAsk =
    weeklyQuestion?.status === 'pending' &&
    weeklyQuestion.assigned_user_id === currentUserId

  const nudge = (() => {
    if (isMyTurnToAsk) return <YourTurnToAskCard />
    if (weeklyQuestion?.status === 'active' && !myAnswer) {
      return (
        <WeeklyQuestionCard
          questionId={weeklyQuestion.id}
          questionText={weeklyQuestion.question_text}
          askedBy={weeklyQuestion.users ?? null}
          userId={currentUserId}
          answeredCount={currentAnswers.length}
          totalMembers={familyMemberCount}
        />
      )
    }
    if (openPromptId) {
      return <PromptCard userId={currentUserId} promptId={openPromptId} />
    }
    return null
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

      {view === 'feed' && currentUserId && (
        <div className="pt-4">{nudge}</div>
      )}

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
              <SectionHeader>
                {formatDateHeader(group.date, dict, dateLocale)}
              </SectionHeader>
              <div className="flex flex-col gap-3.5 px-5">
                {group.items.map((item, i) =>
                  item.type === 'activity' ? (
                    <ActivityCard
                      key={item.data.id}
                      activity={item.data}
                      tilt={i % 2 === 0 ? 'a' : 'b'}
                    />
                  ) : item.type === 'pick' ? (
                    <PickActivityCard
                      key={item.data.id}
                      pick={item.data}
                      tilt={i % 2 === 0 ? 'a' : 'b'}
                    />
                  ) : (
                    <QuestionAnswerCard
                      key={item.data.id}
                      answer={item.data}
                      questionText={item.questionText}
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
