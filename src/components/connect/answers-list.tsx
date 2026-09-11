'use client'

import { AnswerWithUser } from '@/types/database'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { Surface } from '@/components/ui/surface'
import { timeAgo } from '@/lib/connect-utils'

interface AnswersListProps {
  answers: AnswerWithUser[]
  currentUserId: string
}

export function AnswersList({ answers }: AnswersListProps) {
  if (answers.length === 0) {
    return (
      <div className="rounded-card border-card border-edge bg-card px-6 py-10 text-center backdrop-blur-card">
        <p className="font-display text-lg font-bold text-ink">
          No answers yet
        </p>
        <p className="mt-1 text-[13px] font-medium text-ink-soft">
          Be the first to share your thoughts.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {answers.map((answer, i) => (
        <Surface key={answer.id} tilt={i % 2 === 0 ? 'a' : 'b'}>
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
                  {answer.users?.name || 'Unknown'}
                </span>
                <time className="text-[11.5px] font-bold text-ink-faint">
                  {timeAgo(answer.created_at)}
                </time>
              </div>
              <p className="mt-1.5 font-display text-[15px] leading-relaxed text-ink">
                {answer.answer_text}
              </p>
            </div>
          </div>
        </Surface>
      ))}
    </div>
  )
}
