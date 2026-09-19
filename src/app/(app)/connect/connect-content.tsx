'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { familyKeys, fetchFamilyMembers } from '@/lib/queries/family'
import {
  fetchAnsweredQuestions,
  fetchCurrentQuestion,
  questionKeys,
} from '@/lib/queries/questions'
import { fetchOwnCurrentPicks, pickKeys } from '@/lib/queries/picks'
import { useSession } from '@/lib/supabase/session-context'
import { getCurrentWeekNumber } from '@/lib/connect-utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CurrentQuestionCard } from '@/components/connect/current-question-card'
import { AnswerForm } from '@/components/connect/answer-form'
import { AnswersList } from '@/components/connect/answers-list'
import { QuestionSelector } from '@/components/connect/question-selector'
import { MyPicks } from '@/components/connect/my-picks'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/surface'
import { Skeleton } from '@/components/ui/skeleton'
import { Swash } from '@/components/ui/swash'
import { History } from 'lucide-react'

/**
 * The Connect tab.
 *
 * Its four reads used to run in `page.tsx` on the server, and the two writes
 * underneath it — answering, and choosing the week's question — each ended in
 * `window.location.reload()` because there was no cache to update. Answering a
 * one-line question threw away the whole document and rebuilt it. All three
 * reloads (here, `answer-form.tsx` and `question-selector.tsx`) are now a single
 * `invalidateQueries({ queryKey: questionKeys.all })`.
 *
 * The members query deliberately shares `familyKeys.members` with the Family
 * tab. Connect only needs `id`, `name` and `avatar_url` where that key carries a
 * few more columns, but sharing one cache entry makes moving between the two
 * tabs free, which is worth more than the columns cost.
 */
export function ConnectContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { supabase, user, profile, familyId } = useSession()

  // Stable for a week at a time, so it is fine to derive per render. It is part
  // of the question's cache key, which is what makes the turn of the week
  // produce a fresh query rather than a stale hit.
  const currentWeekNumber = getCurrentWeekNumber()

  const scope = familyId ?? ''
  const enabled = Boolean(familyId)
  const userId = user?.id ?? ''

  const membersQuery = useQuery({
    queryKey: familyKeys.members(scope),
    queryFn: () => fetchFamilyMembers(supabase, scope),
    enabled,
  })

  const questionQuery = useQuery({
    queryKey: questionKeys.current(scope, currentWeekNumber),
    queryFn: () => fetchCurrentQuestion(supabase, scope, currentWeekNumber),
    enabled,
  })

  // The history screen's list, fetched here as well so tapping through to it
  // paints from cache. It also replaces the separate "past questions" read this
  // page used to run purely to decide whether to show the button below.
  const answeredQuery = useQuery({
    queryKey: questionKeys.answered(scope),
    queryFn: () => fetchAnsweredQuestions(supabase, scope),
    enabled,
  })

  const picksQuery = useQuery({
    queryKey: pickKeys.own(userId),
    queryFn: () => fetchOwnCurrentPicks(supabase, userId),
    enabled: Boolean(userId),
  })

  /**
   * Creating the family's first weekly question stays an API route.
   *
   * It only uses the user-scoped client, so it could move here — but it inserts
   * a `weekly_questions` row, every member can press the button, and "only once
   * per week" is a check the server can make atomically and a client cannot.
   * What changed is the ending: invalidation instead of a full page reload.
   */
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/connect/initialize', { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Initialize failed with ${response.status}`)
      }
    },
    // Awaited, so the button stays in its pending state until the new question
    // is actually on screen rather than flicking back to "Ask the first
    // question" for a frame.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: questionKeys.all }),
  })

  const familyMembers = membersQuery.data ?? []
  const currentQuestion = questionQuery.data ?? null
  const currentPicks = picksQuery.data ?? []

  // Today's question is `status = 'active'` and so is in this list; the button
  // is about everything else. The server version asked a second query for this
  // (`week_number != current`, any status), which meant a week that was never
  // chosen could light up a button leading to an empty history screen.
  const hasHistory = (answeredQuery.data ?? []).some(
    (question) => question.week_number !== currentWeekNumber
  )

  const currentUserAnswer = currentQuestion?.question_answers?.find(
    (answer) => answer.user_id === userId && answer.is_current
  )

  const otherAnswers =
    currentQuestion?.question_answers?.filter(
      (answer) => answer.user_id !== userId && answer.is_current
    ) || []

  // Only the first uncached load. After that the cached question renders
  // straight away and any refetch happens behind it.
  if (enabled && questionQuery.isPending) {
    return <ConnectContentSkeleton />
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="px-5 pb-1 pt-14">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
          This week
        </div>
        <h1 className="mt-1 font-display text-[30px] font-black leading-[1.06] tracking-tight text-ink">
          Connect
        </h1>
        <Swash profile="header" className="w-28" />
      </header>

      <Tabs defaultValue="questions" className="mt-4 w-full">
        <div className="px-5">
          <TabsList className="w-full">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="picks">My Picks</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="questions">
          <div className="space-y-4 px-5">
            {questionQuery.isError ? (
              /* The server version had no such state. `.single()` rejected on
                 zero rows, the route destructured only `data`, and so both "no
                 question this week" and "the read failed" rendered as the empty
                 state below — a permissions failure looked like a fresh start,
                 with a button offering to create a question that already
                 existed. */
              <div className="rounded-card border-card border-edge bg-card px-6 py-12 text-center backdrop-blur-card">
                <p className="font-display text-lg font-bold text-ink">
                  Couldn&apos;t load this week
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
                  Check your connection and try again.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => questionQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : currentQuestion ? (
              currentQuestion.status === 'pending' ? (
                currentQuestion.assigned_user_id === userId ? (
                  <QuestionSelector question={currentQuestion} />
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
                    userId={userId}
                    existingAnswer={currentUserAnswer}
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
                {initializeMutation.isError && (
                  <p className="mt-3 text-[12.5px] font-bold text-destructive">
                    Couldn&apos;t start the first question. Please try again.
                  </p>
                )}
                <Button
                  onClick={() => initializeMutation.mutate()}
                  disabled={initializeMutation.isPending}
                  className="mt-5"
                >
                  {initializeMutation.isPending
                    ? 'Creating…'
                    : 'Ask the first question'}
                </Button>
              </div>
            )}
          </div>

          {currentQuestion?.status !== 'pending' && otherAnswers.length > 0 && (
            <>
              <SectionHeader>Family answers</SectionHeader>
              <div className="px-5">
                <AnswersList answers={otherAnswers} currentUserId={userId} />
              </div>
            </>
          )}

          {hasHistory && (
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
          {/* Reads the signed-in user's name off the session profile rather
              than looking themselves up in the members list, so the picks tab
              no longer renders blank whenever that separate query is still in
              flight or has failed. */}
          {profile && (
            <MyPicks
              currentPicks={currentPicks}
              userId={userId}
              currentUser={{
                name: profile.name,
                avatar_url: profile.avatar_url,
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Mirrors the layout above so the first uncached load settles into place rather
 * than jumping. `loading.tsx` still covers the navigation itself — this covers
 * the gap between the shell painting and the queries resolving, which only
 * exists now that the data is fetched in the browser.
 */
function ConnectContentSkeleton() {
  return (
    <div className="mx-auto max-w-lg">
      <header className="px-5 pb-1 pt-14">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-36" />
      </header>

      <div className="mt-4 px-5">
        <Skeleton className="h-10 w-full rounded-field" />
      </div>

      <div className="mt-4 space-y-4 px-5">
        <div className="rounded-card border-card border-edge bg-card p-5 shadow-card backdrop-blur-card">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2.5 h-6 w-5/6" />
          <Skeleton className="mt-2 h-6 w-2/3" />
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-24 w-full rounded-field" />
        </div>
      </div>
    </div>
  )
}
