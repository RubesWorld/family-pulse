'use client'

import { useI18n } from '@/components/i18n-provider'

import { User } from '@/types/database'
import { QuestionHistory } from '@/components/connect/question-history'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PastQuestion {
  id: string
  question_text: string
  week_start_date: string
  week_number: number
  status: string
  users?: Pick<User, 'id' | 'name' | 'avatar_url'>
}

interface QuestionHistoryPageProps {
  currentUserId: string
  pastQuestions: PastQuestion[]
}

export function QuestionHistoryPage({ currentUserId, pastQuestions }: QuestionHistoryPageProps) {
  const { dict } = useI18n()
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {dict.connectUi.historyBack}
      </Button>

      <h1 className="text-2xl font-bold mb-6">{dict.connectUi.historyTitle}</h1>

      <QuestionHistory
        pastQuestions={pastQuestions}
        currentUserId={currentUserId}
      />
    </div>
  )
}
