'use client'

import { formatDistanceToNow } from 'date-fns'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { Surface } from '@/components/ui/surface'
import { useI18n } from '@/components/i18n-provider'
import type { AnswerWithUser } from '@/types/database'

interface QuestionAnswerCardProps {
  answer: AnswerWithUser
  /** The question being answered — the feed needs it for context. */
  questionText: string
  tilt?: 'a' | 'b'
}

/**
 * Someone answering the weekly question, as a feed event.
 *
 * These only existed inside Connect before, which meant that on a quiet week
 * the feed showed nothing even while the family was actively talking.
 */
export function QuestionAnswerCard({
  answer,
  questionText,
  tilt,
}: QuestionAnswerCardProps) {
  const { dict, dateLocale } = useI18n()

  return (
    <Surface tilt={tilt}>
      <div className="flex gap-3">
        <GlowAvatar
          name={answer.users?.name}
          userId={answer.user_id}
          avatarUrl={answer.users?.avatar_url}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[14.5px] font-extrabold text-ink">
              {answer.users?.name}
            </span>
            <span className="text-[12.5px] font-bold text-ink-soft">
              {dict.feed.answeredQuestion}
            </span>
            <time className="text-[11.5px] font-bold text-ink-faint">
              {formatDistanceToNow(new Date(answer.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </time>
          </div>

          <p className="mt-1 text-[12.5px] font-bold italic text-ink-faint">
            {questionText}
          </p>

          <p className="mt-1.5 font-display text-[16px] leading-relaxed text-ink">
            {answer.answer_text}
          </p>
        </div>
      </div>
    </Surface>
  )
}
