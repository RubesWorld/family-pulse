'use client'

import { QuestionWithAnswers, User } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatWeekDisplay } from '@/lib/connect-utils'
import { CheckCircle2 } from 'lucide-react'

interface CurrentQuestionCardProps {
  question: QuestionWithAnswers
  familyMembers: Pick<User, 'id' | 'name' | 'avatar_url'>[]
  totalAnswers: number
}

export function CurrentQuestionCard({
  question,
  familyMembers,
  totalAnswers,
}: CurrentQuestionCardProps) {
  const totalMembers = familyMembers.length
  const isComplete = totalAnswers === totalMembers

  // Get members who haven't answered
  const answeredUserIds = new Set(
    question.question_answers?.filter(a => a.is_current).map(a => a.user_id) || []
  )
  const unansweredMembers = familyMembers.filter(
    member => !answeredUserIds.has(member.id)
  )

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{question.question_text}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Asked by {question.users?.name}</span>
              <span>•</span>
              <span>{formatWeekDisplay(question.week_start_date)}</span>
            </div>
          </div>
          {isComplete && (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete!
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500"
              style={{ width: `${(totalAnswers / totalMembers) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {totalAnswers} / {totalMembers}
          </span>
        </div>

        {unansweredMembers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Waiting for:</p>
            <div className="flex flex-wrap gap-2">
              {unansweredMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 border border-gray-200"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-600">
                        {member.name[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
