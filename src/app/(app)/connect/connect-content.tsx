'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { History } from 'lucide-react'
import { QuestionWithAnswers, User } from '@/types/database'
import { QuestionSelector } from '@/components/connect/question-selector'
import {
  QuestionLibrary,
  type LibraryEntry,
} from '@/components/connect/question-library'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'
import {
  PICK_PROMPTS,
  interestEmoji,
  promptLabel,
  resolvePromptId,
} from '@/lib/pick-prompts'

interface PastQuestion {
  id: string
  question_text: string
  week_start_date: string
  week_number: number
  users?: Pick<User, 'id' | 'name' | 'avatar_url'>
  question_answers?: {
    user_id: string
    answer_text: string
    is_current: boolean
  }[]
}

interface ConnectContentProps {
  currentUserId: string
  familyMembers: Pick<User, 'id' | 'name' | 'avatar_url'>[]
  currentQuestion: QuestionWithAnswers | null
  pastQuestions: PastQuestion[]
  /** Every family member's current answers, for the side-by-side browse. */
  familyPicks: Array<{ user_id: string; category: string; value: string }>
}

/**
 * Connect is the library, not a second feed.
 *
 * Everything that happens — a question being asked, someone answering, a pick
 * changing — is an event, and those now flow through the Feed. What is left
 * here is the part with no time dimension: what the family has answered,
 * browsable a question at a time.
 *
 * Weekly questions and interest prompts share one list because they are the
 * same shape. Splitting them into tabs implied a difference that was not real.
 */
export function ConnectContent({
  currentUserId,
  familyMembers,
  currentQuestion,
  pastQuestions,
  familyPicks,
}: ConnectContentProps) {
  const router = useRouter()
  const { dict, locale } = useI18n()
  const [initializing, setInitializing] = useState(false)

  const isMyTurnToAsk =
    currentQuestion?.status === 'pending' &&
    currentQuestion.assigned_user_id === currentUserId

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

  const entries = useMemo<LibraryEntry[]>(() => {
    const out: LibraryEntry[] = []

    // A pending question has no text worth showing yet, so only active ones
    // join the library.
    const weekly: PastQuestion[] = [
      ...(currentQuestion && currentQuestion.status === 'active'
        ? [currentQuestion as unknown as PastQuestion]
        : []),
      ...pastQuestions,
    ]

    for (const q of weekly) {
      const answers: Record<string, string> = {}
      for (const a of q.question_answers ?? []) {
        if (a.is_current) answers[a.user_id] = a.answer_text
      }
      out.push({
        id: `weekly:${q.id}`,
        label: q.question_text,
        emoji: '💬',
        kind: 'weekly',
        answers,
      })
    }

    const byPrompt = new Map<string, Record<string, string>>()
    for (const pick of familyPicks) {
      if (!pick.value?.trim()) continue
      const id = resolvePromptId(pick.category)
      if (!byPrompt.has(id)) byPrompt.set(id, {})
      byPrompt.get(id)![pick.user_id] = pick.value
    }

    for (const prompt of PICK_PROMPTS) {
      const answers = byPrompt.get(prompt.id)
      if (!answers) continue
      out.push({
        id: `interest:${prompt.id}`,
        label: promptLabel(prompt, locale),
        emoji: interestEmoji(prompt.interest),
        kind: 'interest',
        answers,
      })
    }

    return out
  }, [currentQuestion, pastQuestions, familyPicks, locale])

  return (
    <div className="mx-auto max-w-lg">
      <header className="px-5 pb-1 pt-screen">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
          {dict.connect.libraryHint}
        </div>
        <h1 className="mt-1 font-display text-[30px] font-black leading-[1.06] tracking-tight text-ink">
          {dict.connect.title}
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

      <div className="mt-5 space-y-4">
        {/* Choosing this week's question is the one action still living here:
            it is a decision, not a feed event. */}
        {isMyTurnToAsk && currentQuestion && (
          <div className="px-5">
            <QuestionSelector question={currentQuestion} />
          </div>
        )}

        {!currentQuestion && (
          <div className="mx-5 rounded-card border-card border-edge bg-card px-6 py-10 text-center backdrop-blur-card">
            <div className="text-3xl">🌱</div>
            <p className="mt-3 font-display text-lg font-bold text-ink">
              No question yet
            </p>
            <Button
              onClick={handleInitialize}
              disabled={initializing}
              className="mt-4"
            >
              {initializing ? dict.common.saving : 'Ask the first question'}
            </Button>
          </div>
        )}

        <QuestionLibrary
          members={familyMembers}
          entries={entries}
          currentUserId={currentUserId}
        />

        {pastQuestions.length > 0 && (
          <div className="px-5 pt-2">
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
      </div>
    </div>
  )
}
