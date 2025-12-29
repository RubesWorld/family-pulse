'use client'

import { AnswerWithUser } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { timeAgo } from '@/lib/connect-utils'

interface AnswersListProps {
  answers: AnswerWithUser[]
  currentUserId: string
}

export function AnswersList({ answers }: AnswersListProps) {
  if (answers.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No answers from family yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Be the first to share your thoughts!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Family Answers</h2>
      <div className="space-y-3">
        {answers.map((answer) => (
          <Card key={answer.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {answer.users?.avatar_url ? (
                    <img
                      src={answer.users.avatar_url}
                      alt={answer.users.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-gray-600">
                      {answer.users?.name?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {answer.users?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {timeAgo(answer.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {answer.answer_text}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
