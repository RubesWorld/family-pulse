'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { fetchAnsweredQuestions, questionKeys } from '@/lib/queries/questions'
import { useSession } from '@/lib/supabase/session-context'
import { QuestionHistory } from '@/components/connect/question-history'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'

/**
 * The past-questions screen.
 *
 * Shares `questionKeys.answered` with the Connect tab, which prefetches it as
 * the gate for the button that leads here. That is the dedupe the plan called
 * for: the server rendered two near-identical `weekly_questions` queries, one
 * per screen, and paid a round-trip on every arrival. Now the first screen to
 * ask fills the cache and the second one reads it.
 */
export function QuestionHistoryPage() {
  const router = useRouter()
  const { supabase, familyId } = useSession()

  const scope = familyId ?? ''

  const questionsQuery = useQuery({
    queryKey: questionKeys.answered(scope),
    queryFn: () => fetchAnsweredQuestions(supabase, scope),
    enabled: Boolean(familyId),
  })

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Connect
      </Button>

      <h1 className="text-2xl font-bold mb-6">Question History</h1>

      {familyId && questionsQuery.isPending ? (
        <div className="flex flex-col gap-3.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      ) : questionsQuery.isError ? (
        <div className="rounded-card border-card border-edge bg-card px-6 py-12 text-center backdrop-blur-card">
          <p className="font-display text-lg font-bold text-ink">
            Couldn&apos;t load the history
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => questionsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <QuestionHistory pastQuestions={questionsQuery.data ?? []} />
      )}
    </div>
  )
}
