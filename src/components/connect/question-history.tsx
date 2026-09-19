'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchArchivedAnswers,
  questionKeys,
  type PastQuestion,
} from '@/lib/queries/questions'
import { useSession } from '@/lib/supabase/session-context'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { formatWeekDisplay, timeAgo } from '@/lib/connect-utils'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionHistoryProps {
  pastQuestions: PastQuestion[]
}

export function QuestionHistory({ pastQuestions }: QuestionHistoryProps) {
  if (pastQuestions.length === 0) {
    return (
      <div className="rounded-card border-card border-edge bg-card px-6 py-12 text-center backdrop-blur-card">
        <div className="text-3xl">📭</div>
        <p className="mt-3 font-display text-lg font-bold text-ink">
          No past questions yet
        </p>
        <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
          History shows up here once the week turns over.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {pastQuestions.map((question) => (
        <QuestionHistoryRow key={question.id} question={question} />
      ))}
    </div>
  )
}

/**
 * One collapsible question.
 *
 * A component per row rather than the parent's three `useState` collections —
 * an expanded `Set`, a `Record` of loaded answers and a `Set` of in-flight ids,
 * all hand-maintained. `enabled` expresses "fetch when expanded" directly, and
 * the answers stay in the cache afterwards, so collapsing and re-expanding no
 * longer re-reads anything and neither does leaving the screen and coming back.
 */
function QuestionHistoryRow({ question }: { question: PastQuestion }) {
  const { supabase } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)

  const answersQuery = useQuery({
    queryKey: questionKeys.answers(question.id),
    queryFn: () => fetchArchivedAnswers(supabase, question.id),
    enabled: isExpanded,
  })

  const answers = answersQuery.data ?? []

  return (
    <div className="rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[17px] font-bold leading-snug text-ink">
            {question.question_text}
          </h3>
          <p className="mt-1.5 text-[11.5px] font-bold text-ink-soft">
            Asked by {question.users?.name} ·{' '}
            {formatWeekDisplay(question.week_start_date)}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 flex-none text-ink-faint transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-edge px-4 py-3.5">
          {answersQuery.isPending ? (
            <p className="py-2 text-center text-[12.5px] font-semibold text-ink-soft">
              Loading answers…
            </p>
          ) : answersQuery.isError ? (
            /* The original read `{ data }` and ignored `error`, so a failed
               load was indistinguishable from a question nobody answered. */
            <p className="py-2 text-center text-[12.5px] font-semibold text-ink-soft">
              Couldn&apos;t load these answers.
            </p>
          ) : answers.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {answers.map((answer) => (
                <div key={answer.id} className="flex items-start gap-2.5">
                  <GlowAvatar
                    name={answer.users?.name}
                    userId={answer.user_id}
                    avatarUrl={answer.users?.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-extrabold text-ink">
                        {answer.users?.name || 'Unknown'}
                      </span>
                      <time className="text-[11px] font-bold text-ink-faint">
                        {timeAgo(answer.created_at)}
                      </time>
                    </div>
                    <p className="mt-1 font-display text-[14px] leading-relaxed text-ink-soft">
                      {answer.answer_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-[12.5px] font-semibold text-ink-soft">
              No answers for this one.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
