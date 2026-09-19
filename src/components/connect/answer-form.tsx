'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QuestionAnswer } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { questionKeys, submitAnswer } from '@/lib/queries/questions'
import { useSession } from '@/lib/supabase/session-context'
import { useTheme } from '@/components/theme-provider'
import { withAlpha } from '@/lib/theme-tokens'
import { CheckCircle2, Edit2 } from 'lucide-react'

const SUBMIT_ERROR = 'Failed to submit answer. Please try again.'

interface AnswerFormProps {
  questionId: string
  userId: string
  existingAnswer?: QuestionAnswer
}

export function AnswerForm({
  questionId,
  userId,
  existingAnswer,
}: AnswerFormProps) {
  const { supabase } = useSession()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(!existingAnswer)
  const [answer, setAnswer] = useState(existingAnswer?.answer_text || '')
  const [emptyError, setEmptyError] = useState<string | null>(null)
  const { accents } = useTheme()

  /**
   * Answering used to end in `window.location.reload()` — a full document
   * teardown, re-auth and re-render of every tab, to show one new paragraph.
   * Invalidating the question is the same result without leaving the page.
   */
  const submitMutation = useMutation({
    mutationFn: (answerText: string) =>
      submitAnswer(supabase, {
        questionId,
        userId,
        answerText,
        previousAnswerId: existingAnswer?.id,
      }),
    // Awaited, so `isPending` stays true until the refetched question is in the
    // cache. Without that the form would drop back to its editing state for a
    // frame — the parent still holds the old data, in which this member has not
    // answered — which is the flicker the reload used to hide.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: questionKeys.all })
      setIsEditing(false)
    },
  })

  const loading = submitMutation.isPending
  const error = emptyError ?? (submitMutation.isError ? SUBMIT_ERROR : null)

  const handleSubmit = () => {
    if (!answer.trim()) {
      setEmptyError('Please enter an answer')
      return
    }

    setEmptyError(null)
    submitMutation.mutate(answer.trim())
  }

  // Answered and resting — sage-tinted so it reads as settled.
  if (existingAnswer && !isEditing) {
    return (
      <div
        className="rounded-card border-card p-4 backdrop-blur-card"
        style={{
          background: withAlpha(accents.sage, 0.12),
          borderColor: withAlpha(accents.sage, 0.4),
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-sage">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Your answer
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-ink-faint transition-colors hover:text-ink"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
        </div>
        <p className="mt-2.5 font-display text-[15px] leading-relaxed text-ink">
          {existingAnswer.answer_text}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card">
      <h3 className="mb-2.5 font-display text-[17px] font-bold text-ink">
        {existingAnswer ? 'Edit your answer' : 'Your turn'}
      </h3>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here…"
        rows={4}
        className="resize-none"
        disabled={loading}
      />

      {error && (
        <p className="mt-2 text-[12.5px] font-bold text-destructive">{error}</p>
      )}

      <div className="mt-3 flex gap-2">
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading
            ? 'Sending…'
            : existingAnswer
              ? 'Update answer'
              : 'Share answer'}
        </Button>
        {existingAnswer && (
          <Button
            variant="ghost"
            onClick={() => {
              setAnswer(existingAnswer.answer_text)
              setEmptyError(null)
              submitMutation.reset()
              setIsEditing(false)
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
