'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnswerWithUser, User } from '@/types/database'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { format, formatDistanceToNow } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { useI18n } from '@/components/i18n-provider'

interface PastQuestion {
  id: string
  question_text: string
  week_start_date: string
  week_number: number
  users?: Pick<User, 'id' | 'name' | 'avatar_url'>
}

interface QuestionHistoryProps {
  pastQuestions: PastQuestion[]
  currentUserId: string
}

export function QuestionHistory({ pastQuestions }: QuestionHistoryProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [loadedAnswers, setLoadedAnswers] = useState<Record<string, AnswerWithUser[]>>({})
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const { dict, dateLocale } = useI18n()

  const toggleQuestion = async (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)

    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)

      // Load answers if not already loaded
      if (!loadedAnswers[questionId]) {
        setLoading((prev) => new Set(prev).add(questionId))

        const supabase = createClient()
        const { data } = await supabase
          .from('question_answers')
          .select('*, users(id, name, avatar_url)')
          .eq('question_id', questionId)
          .eq('is_current', false) // Historical answers
          .order('created_at', { ascending: false })

        setLoadedAnswers((prev) => ({ ...prev, [questionId]: data || [] }))
        setLoading((prev) => {
          const next = new Set(prev)
          next.delete(questionId)
          return next
        })
      }
    }

    setExpandedQuestions(newExpanded)
  }

  if (pastQuestions.length === 0) {
    return (
      <div className="rounded-card border-card border-edge bg-card px-6 py-12 text-center backdrop-blur-card">
        <div className="text-3xl">📭</div>
        <p className="mt-3 font-display text-lg font-bold text-ink">
          {dict.connectUi.noPastQuestions}
        </p>
        <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
          {dict.connectUi.noPastHint}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {pastQuestions.map((question) => {
        const isExpanded = expandedQuestions.has(question.id)
        const answers = loadedAnswers[question.id] || []
        const isLoading = loading.has(question.id)

        return (
          <div
            key={question.id}
            className="rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card"
          >
            <button
              type="button"
              onClick={() => toggleQuestion(question.id)}
              aria-expanded={isExpanded}
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[17px] font-bold leading-snug text-ink">
                  {question.question_text}
                </h3>
                <p className="mt-1.5 text-[11.5px] font-bold text-ink-soft">
                  {t(dict.connectUi.askedBy, { name: question.users?.name ?? '' })} ·{' '}
                  {format(new Date(question.week_start_date), 'PP', { locale: dateLocale })}
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
                {isLoading ? (
                  <p className="py-2 text-center text-[12.5px] font-semibold text-ink-soft">
                    {dict.connectUi.loadingAnswers}
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
                              {formatDistanceToNow(new Date(answer.created_at), {
                                addSuffix: true,
                                locale: dateLocale,
                              })}
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
                    {dict.connectUi.noAnswersForThis}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
