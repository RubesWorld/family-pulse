'use client'

import { QuestionWithAnswers, User } from '@/types/database'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { formatWeekDisplay } from '@/lib/connect-utils'
import { CheckCircle2 } from 'lucide-react'

interface CurrentQuestionCardProps {
  question: QuestionWithAnswers
  familyMembers: Pick<User, 'id' | 'name' | 'avatar_url'>[]
  totalAnswers: number
}

export function CurrentQuestionCard({
  question,
  familyMembers,
  totalAnswers,
}: CurrentQuestionCardProps) {
  const totalMembers = familyMembers.length
  const isComplete = totalMembers > 0 && totalAnswers === totalMembers
  const pct = totalMembers > 0 ? (totalAnswers / totalMembers) * 100 : 0

  const answeredUserIds = new Set(
    question.question_answers?.filter((a) => a.is_current).map((a) => a.user_id) || []
  )
  const unansweredMembers = familyMembers.filter(
    (member) => !answeredUserIds.has(member.id)
  )

  return (
    <div
      className="rounded-card border-card p-5 backdrop-blur-card"
      style={{
        background:
          'linear-gradient(150deg, hsl(var(--plum) / 0.22), hsl(var(--denim) / 0.12))',
        borderColor: 'hsl(var(--plum) / 0.34)',
        boxShadow:
          '0 14px 40px -16px hsl(var(--plum) / calc(0.85 * var(--glow))), inset 0 1px 0 rgb(255 235 210 / 0.14)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[23px] font-bold leading-tight tracking-tight text-ink">
          {question.question_text}
        </h2>
        {isComplete && (
          <span className="inline-flex flex-none items-center gap-1 rounded-full border border-sage/40 bg-sage/[0.18] px-2.5 py-1 text-[11px] font-extrabold text-sage">
            <CheckCircle2 className="h-3 w-3" />
            All in
          </span>
        )}
      </div>

      <p className="mt-2.5 text-[11.5px] font-bold text-ink-soft">
        Asked by {question.users?.name} · {formatWeekDisplay(question.week_start_date)}
      </p>

      {/* progress */}
      <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-coral to-marigold transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            boxShadow:
              '0 0 14px hsl(var(--marigold) / calc(0.9 * var(--glow)))',
          }}
        />
      </div>
      <p className="mt-1.5 text-[11.5px] font-extrabold text-ink-soft">
        {totalAnswers} of {totalMembers} answered
      </p>

      {unansweredMembers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-edge pt-3">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-ink-faint">
            Waiting on
          </span>
          {unansweredMembers.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 py-1 pl-1 pr-2.5 text-[11px] font-extrabold text-ink-soft"
            >
              <GlowAvatar
                name={member.name}
                userId={member.id}
                avatarUrl={member.avatar_url}
                size="xs"
              />
              {member.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
