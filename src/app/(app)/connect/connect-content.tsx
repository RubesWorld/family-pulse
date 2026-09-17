'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionWithAnswers, User, UserPick } from '@/types/database'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CurrentQuestionCard } from '@/components/connect/current-question-card'
import { AnswerForm } from '@/components/connect/answer-form'
import { AnswersList } from '@/components/connect/answers-list'
import { QuestionSelector } from '@/components/connect/question-selector'
import { MyPicks } from '@/components/connect/my-picks'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/surface'
import { useI18n } from '@/components/i18n-provider'
import { History } from 'lucide-react'

interface PastQuestion {
  id: string
  question_text: string
  week_start_date: string
  week_number: number
  users?: Pick<User, 'id' | 'name' | 'avatar_url'>
}

interface ConnectContentProps {
  currentUserId: string
  familyMembers: Pick<User, 'id' | 'name' | 'avatar_url'>[]
  currentQuestion: QuestionWithAnswers | null
  pastQuestions: PastQuestion[]
  currentPicks: UserPick[]
}

export function ConnectContent({
  currentUserId,
  familyMembers,
  currentQuestion,
  pastQuestions,
  currentPicks,
}: ConnectContentProps) {
  const router = useRouter()
  const { dict } = useI18n()
  const [initializing, setInitializing] = useState(false)

  const currentUser = familyMembers.find((member) => member.id === currentUserId)

  const handleAnswerSubmit = () => {
    // Placeholder for future optimistic updates
  }

  const handleInitialize = async () => {
    setInitializing(true)
    try {
      const response = await fetch('/api/connect/initialize', { method: 'POST' })
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

  const currentUserAnswer = currentQuestion?.question_answers?.find(
    (answer) => answer.user_id === currentUserId && answer.is_current
  )

  const otherAnswers =
    currentQuestion?.question_answers?.filter(
      (answer) => answer.user_id !== currentUserId && answer.is_current
    ) || []

  return (
    <div className="mx-auto max-w-lg">
      <header className="px-5 pb-1 pt-14">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
          This week
        </div>
        <h1 className="mt-1 font-display text-[30px] font-black leading-[1.06] tracking-tight text-ink">
          Connect
        </h1>
        <svg
          aria-hidden
          viewBox="0 0 132 9"
          fill="none"
          className="mt-0.5 block h-2 w-28 text-marigold"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--marigold) / var(--glow)))',
          }}
        >
          <path
            d="M2 6.2c22-4.4 44-5.2 66-3.1 21 2 42 2.4 63-.6"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </header>

      <Tabs defaultValue="questions" className="mt-4 w-full">
        <div className="px-5">
          <TabsList className="w-full">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="picks">{dict.picks.title}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="questions">
          <div className="space-y-4 px-5">
            {currentQuestion ? (
              currentQuestion.status === 'pending' ? (
                currentQuestion.assigned_user_id === currentUserId ? (
                  <QuestionSelector
                    question={currentQuestion}
                    onQuestionActivated={handleAnswerSubmit}
                  />
                ) : (
                  <div className="rounded-card border-card border-edge bg-card px-6 py-12 text-center backdrop-blur-card">
                    <div className="text-3xl">⏳</div>
                    <p className="mt-3 font-display text-lg font-bold text-ink">
                      Waiting for {currentQuestion.users?.name}
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
                      They&apos;re picking this week&apos;s question. Everyone can
                      answer once they do.
                    </p>
                  </div>
                )
              ) : (
                <>
                  <CurrentQuestionCard
                    question={currentQuestion}
                    familyMembers={familyMembers}
                    totalAnswers={
                      currentQuestion.question_answers?.filter(
                        (a) => a.is_current
                      ).length || 0
                    }
                  />

                  <AnswerForm
                    questionId={currentQuestion.id}
                    userId={currentUserId}
                    existingAnswer={currentUserAnswer}
                    onSubmit={handleAnswerSubmit}
                  />
                </>
              )
            ) : (
              <div className="rounded-card border-card border-edge bg-card px-6 py-12 text-center backdrop-blur-card">
                <div className="text-3xl">🌱</div>
                <p className="mt-3 font-display text-lg font-bold text-ink">
                  No question yet
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
                  Start the first one and the family can weigh in.
                </p>
                <Button
                  onClick={handleInitialize}
                  disabled={initializing}
                  className="mt-5"
                >
                  {initializing ? 'Creating…' : 'Ask the first question'}
                </Button>
              </div>
            )}
          </div>

          {currentQuestion?.status !== 'pending' && otherAnswers.length > 0 && (
            <>
              <SectionHeader>Family answers</SectionHeader>
              <div className="px-5">
                <AnswersList
                  answers={otherAnswers}
                  currentUserId={currentUserId}
                />
              </div>
            </>
          )}

          {pastQuestions.length > 0 && (
            <div className="px-5 pt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/connect/history')}
              >
                <History className="h-4 w-4" />
                View past questions
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="picks">
          {currentUser && (
            <MyPicks
              currentPicks={currentPicks}
              userId={currentUserId}
              currentUser={{
                name: currentUser.name,
                avatar_url: currentUser.avatar_url,
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
