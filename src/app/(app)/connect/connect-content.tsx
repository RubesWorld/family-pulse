'use client'

import { useState } from 'react'
import { QuestionWithAnswers, User } from '@/types/database'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CurrentQuestionCard } from '@/components/connect/current-question-card'
import { AnswerForm } from '@/components/connect/answer-form'
import { AnswersList } from '@/components/connect/answers-list'
import { QuestionHistory } from '@/components/connect/question-history'
import { Button } from '@/components/ui/button'

interface ConnectContentProps {
  currentUserId: string
  familyMembers: Pick<User, 'id' | 'name' | 'avatar_url'>[]
  currentQuestion: QuestionWithAnswers | null
  pastQuestions: any[]
}

export function ConnectContent({
  currentUserId,
  familyMembers,
  currentQuestion,
  pastQuestions,
}: ConnectContentProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [initializing, setInitializing] = useState(false)

  const handleAnswerSubmit = () => {
    // Trigger a refresh by incrementing the key
    setRefreshKey(prev => prev + 1)
  }

  const handleInitialize = async () => {
    setInitializing(true)
    try {
      const response = await fetch('/api/connect/initialize', {
        method: 'POST',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        console.error('Failed to initialize')
      }
    } catch (error) {
      console.error('Error initializing:', error)
    } finally {
      setInitializing(false)
    }
  }

  // Find current user's answer
  const currentUserAnswer = currentQuestion?.question_answers?.find(
    answer => answer.user_id === currentUserId && answer.is_current
  )

  // Get other family members' answers (excluding current user)
  const otherAnswers = currentQuestion?.question_answers?.filter(
    answer => answer.user_id !== currentUserId && answer.is_current
  ) || []

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Connect</h1>

      <Tabs defaultValue="this-week" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="this-week" className="space-y-6">
          {currentQuestion ? (
            <>
              <CurrentQuestionCard
                question={currentQuestion}
                familyMembers={familyMembers}
                totalAnswers={currentQuestion.question_answers?.filter(a => a.is_current).length || 0}
              />

              <AnswerForm
                questionId={currentQuestion.id}
                userId={currentUserId}
                existingAnswer={currentUserAnswer}
                onSubmit={handleAnswerSubmit}
              />

              <AnswersList
                answers={otherAnswers}
                currentUserId={currentUserId}
              />
            </>
          ) : (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg mb-2">No question for this week yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Get started by creating your first question
              </p>
              <Button onClick={handleInitialize} disabled={initializing}>
                {initializing ? 'Creating...' : 'Create First Question'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <QuestionHistory
            pastQuestions={pastQuestions}
            currentUserId={currentUserId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
