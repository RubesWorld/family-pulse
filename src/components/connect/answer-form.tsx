'use client'

import { useState } from 'react'
import { QuestionAnswer } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

      // Insert new answer
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

  if (existingAnswer && !isEditing) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Your Answer
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{existingAnswer.answer_text}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {existingAnswer ? 'Edit Your Answer' : 'Share Your Answer'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={4}
          className="resize-none"
          disabled={loading}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Submitting...' : existingAnswer ? 'Update Answer' : 'Submit Answer'}
          </Button>
          {existingAnswer && (
            <Button
              variant="outline"
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
      </CardContent>
    </Card>
  )
}
