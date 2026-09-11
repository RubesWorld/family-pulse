'use client'

import { useState } from 'react'
import { WeeklyQuestion } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Edit3 } from 'lucide-react'

interface QuestionSelectorProps {
  question: WeeklyQuestion
  onQuestionActivated?: () => void
}

export function QuestionSelector({
  question,
  onQuestionActivated,
}: QuestionSelectorProps) {
  const [mode, setMode] = useState<'choose' | 'custom'>('choose')
  const [customQuestion, setCustomQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activate = async (text: string, isPreset: boolean) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from('weekly_questions')
        .update({
          question_text: text,
          status: 'active',
          is_preset: isPreset,
        })
        .eq('id', question.id)

      if (updateError) throw updateError

      onQuestionActivated?.()
      window.location.reload()
    } catch (err) {
      console.error('Error activating question:', err)
      setError('Failed to activate question. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-card border-card p-5 backdrop-blur-card"
      style={{
        background:
          'linear-gradient(150deg, hsl(var(--plum) / 0.24), hsl(var(--coral) / 0.12))',
        borderColor: 'hsl(var(--plum) / 0.38)',
        boxShadow:
          '0 14px 40px -16px hsl(var(--plum) / calc(0.85 * var(--glow))), inset 0 1px 0 rgb(255 235 210 / 0.14)',
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
                  setError('Please enter a question')
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
                setError(null)
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
