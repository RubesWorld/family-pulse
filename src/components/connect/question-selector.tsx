'use client'

import { useState } from 'react'
import { WeeklyQuestion } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Edit3 } from 'lucide-react'

interface QuestionSelectorProps {
  question: WeeklyQuestion
  onQuestionActivated?: () => void
}

export function QuestionSelector({ question, onQuestionActivated }: QuestionSelectorProps) {
  const [mode, setMode] = useState<'choose' | 'custom'>('choose')
  const [customQuestion, setCustomQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUsePreset = async () => {
    if (!question.suggested_question_text) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from('weekly_questions')
        .update({
          question_text: question.suggested_question_text,
          status: 'active',
          is_preset: true,
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

  const handleSubmitCustom = async () => {
    if (!customQuestion.trim()) {
      setError('Please enter a question')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from('weekly_questions')
        .update({
          question_text: customQuestion.trim(),
          status: 'active',
          is_preset: false,
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
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          It&apos;s Your Turn to Ask This Week!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'choose' ? (
          <>
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Suggested Question</p>
              <p className="text-lg font-medium text-gray-900">
                {question.suggested_question_text}
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleUsePreset}
                disabled={loading}
                className="h-12"
                variant="default"
              >
                {loading ? 'Activating...' : 'Use This Question'}
              </Button>
              <Button
                onClick={() => setMode('custom')}
                disabled={loading}
                className="h-12 gap-2"
                variant="outline"
              >
                <Edit3 className="w-4 h-4" />
                Write My Own
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Your Custom Question</p>
              <Textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="What question would you like to ask your family this week?"
                rows={4}
                className="resize-none"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleSubmitCustom}
                disabled={loading || !customQuestion.trim()}
                className="h-12"
              >
                {loading ? 'Activating...' : 'Use This Question'}
              </Button>
              <Button
                onClick={() => {
                  setMode('choose')
                  setCustomQuestion('')
                  setError(null)
                }}
                disabled={loading}
                className="h-12"
                variant="outline"
              >
                Back
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
