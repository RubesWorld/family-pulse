'use client'

import { useState } from 'react'
import { QuestionAnswer } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Edit2 } from 'lucide-react'

interface AnswerFormProps {
  questionId: string
  userId: string
  existingAnswer?: QuestionAnswer
  onSubmit?: () => void
}

export function AnswerForm({
  questionId,
  userId,
  existingAnswer,
  onSubmit,
}: AnswerFormProps) {
  const [isEditing, setIsEditing] = useState(!existingAnswer)
  const [answer, setAnswer] = useState(existingAnswer?.answer_text || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError('Please enter an answer')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // If there's an existing answer, archive it first
      if (existingAnswer) {
        await supabase
          .from('question_answers')
          .update({ is_current: false })
          .eq('id', existingAnswer.id)
      }

      const { error: insertError } = await supabase
        .from('question_answers')
        .insert({
          question_id: questionId,
          user_id: userId,
          answer_text: answer.trim(),
          is_current: true,
        })

      if (insertError) throw insertError

      setIsEditing(false)
      onSubmit?.()

      // Reload the page to get fresh data
      window.location.reload()
    } catch (err) {
      console.error('Error submitting answer:', err)
      setError('Failed to submit answer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Answered and resting — sage-tinted so it reads as settled.
  if (existingAnswer && !isEditing) {
    return (
      <div
        className="rounded-card border-card p-4 backdrop-blur-card"
        style={{
          background: 'hsl(var(--sage) / 0.12)',
          borderColor: 'hsl(var(--sage) / 0.4)',
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
