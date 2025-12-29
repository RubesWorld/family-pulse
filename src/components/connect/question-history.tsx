'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { AnswerWithUser } from '@/types/database'
import { formatWeekDisplay, timeAgo } from '@/lib/connect-utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface QuestionHistoryProps {
  pastQuestions: any[]
  currentUserId: string
}

export function QuestionHistory({ pastQuestions, currentUserId }: QuestionHistoryProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [loadedAnswers, setLoadedAnswers] = useState<Record<string, AnswerWithUser[]>>({})
  const [loading, setLoading] = useState<Set<string>>(new Set())

  const toggleQuestion = async (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)

    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)

      // Load answers if not already loaded
      if (!loadedAnswers[questionId]) {
        setLoading(new Set([...loading, questionId]))

        const supabase = createClient()
        const { data } = await supabase
          .from('question_answers')
          .select('*, users(id, name, avatar_url)')
          .eq('question_id', questionId)
          .eq('is_current', false) // Historical answers
          .order('created_at', { ascending: false })

        setLoadedAnswers(prev => ({ ...prev, [questionId]: data || [] }))
        setLoading(prev => {
          const newLoading = new Set(prev)
          newLoading.delete(questionId)
          return newLoading
        })
      }
    }

    setExpandedQuestions(newExpanded)
  }

  if (pastQuestions.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">No past questions yet</p>
        <p className="text-sm text-gray-400 mt-1">
          History will appear here after the week changes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pastQuestions.map((question) => {
        const isExpanded = expandedQuestions.has(question.id)
        const answers = loadedAnswers[question.id] || []
        const isLoading = loading.has(question.id)

        return (
          <Card key={question.id}>
            <CardHeader>
              <div
                className="flex items-start justify-between gap-4 cursor-pointer"
                onClick={() => toggleQuestion(question.id)}
              >
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{question.question_text}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Asked by {question.users?.name}</span>
                    <span>•</span>
                    <span>{formatWeekDisplay(question.week_start_date)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Loading answers...</p>
                  </div>
                ) : answers.length > 0 ? (
                  <div className="space-y-3 border-t pt-4">
                    {answers.map((answer) => (
                      <div key={answer.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {answer.users?.avatar_url ? (
                            <img
                              src={answer.users.avatar_url}
                              alt={answer.users.name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-600">
                              {answer.users?.name?.[0] || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {answer.users?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {timeAgo(answer.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {answer.answer_text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border-t">
                    <p className="text-sm text-gray-500">No answers for this question</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
