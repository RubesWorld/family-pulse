'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WeeklyQuestion } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { activateQuestion, questionKeys } from '@/lib/queries/questions'
import { useSession } from '@/lib/supabase/session-context'
import { useTheme } from '@/components/theme-provider'
import { withAlpha } from '@/lib/theme-tokens'
import { Edit3 } from 'lucide-react'

const ACTIVATE_ERROR = 'Failed to activate question. Please try again.'

interface QuestionSelectorProps {
  question: WeeklyQuestion
}

export function QuestionSelector({ question }: QuestionSelectorProps) {
  const { supabase } = useSession()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'choose' | 'custom'>('choose')
  const [customQuestion, setCustomQuestion] = useState('')
  const [emptyError, setEmptyError] = useState<string | null>(null)
  const { accents, glowColor } = useTheme()

  /**
   * Setting the week's question used to reload the document. It invalidates
   * instead — and awaits the refetch, so this card stays in its pending state
   * until the parent has the activated question and swaps it for the answer
   * form, rather than briefly re-offering the choice that was just made.
   */
  const activateMutation = useMutation({
    mutationFn: (params: { text: string; isPreset: boolean }) =>
      activateQuestion(supabase, {
        questionId: question.id,
        questionText: params.text,
        isPreset: params.isPreset,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: questionKeys.all }),
  })

  const loading = activateMutation.isPending
  const error = emptyError ?? (activateMutation.isError ? ACTIVATE_ERROR : null)

  const activate = (text: string, isPreset: boolean) => {
    setEmptyError(null)
    activateMutation.mutate({ text, isPreset })
  }

  return (
    <div
      className="rounded-card border-card p-5 backdrop-blur-card"
      style={{
        background: `linear-gradient(150deg, ${withAlpha(
          accents.plum,
          0.24
        )}, ${withAlpha(accents.coral, 0.12)})`,
        borderColor: withAlpha(accents.plum, 0.38),
        boxShadow: `0 14px 40px -16px ${glowColor(
          'plum',
          0.85
        )}, inset 0 1px 0 rgb(255 235 210 / 0.14)`,
      }}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold">
        Your turn
      </div>
      <h2 className="mt-1.5 font-display text-[22px] font-bold leading-tight tracking-tight text-ink">
        Pick this week&apos;s question
      </h2>

      {mode === 'choose' ? (
        <>
          <div className="mt-4 rounded-panel border-card border-edge bg-card p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">
              Suggested
            </p>
            <p className="mt-1.5 font-display text-[17px] font-bold leading-snug text-ink">
              {question.suggested_question_text}
            </p>
          </div>

          {error && (
            <p className="mt-3 text-[12.5px] font-bold text-destructive">
              {error}
            </p>
          )}

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Button
              onClick={() =>
                question.suggested_question_text &&
                activate(question.suggested_question_text, true)
              }
              disabled={loading || !question.suggested_question_text}
            >
              {loading ? 'Setting…' : 'Use this one'}
            </Button>
            <Button
              onClick={() => setMode('custom')}
              disabled={loading}
              variant="outline"
            >
              <Edit3 className="h-4 w-4" />
              Write my own
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-extrabold text-ink-soft">
              Your question
            </p>
            <Textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="What would you like to ask your family this week?"
              rows={4}
              className="resize-none"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <p className="mt-3 text-[12.5px] font-bold text-destructive">
              {error}
            </p>
          )}

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Button
              onClick={() => {
                if (!customQuestion.trim()) {
                  setEmptyError('Please enter a question')
                  return
                }
                activate(customQuestion.trim(), false)
              }}
              disabled={loading || !customQuestion.trim()}
            >
              {loading ? 'Setting…' : 'Ask this'}
            </Button>
            <Button
              onClick={() => {
                setMode('choose')
                setCustomQuestion('')
                setEmptyError(null)
                activateMutation.reset()
              }}
              disabled={loading}
              variant="ghost"
            >
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
