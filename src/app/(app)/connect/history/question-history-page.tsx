'use client'

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
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Connect
      </Button>

      <h1 className="text-2xl font-bold mb-6">Question History</h1>

      <QuestionHistory
        pastQuestions={pastQuestions}
        currentUserId={currentUserId}
      />
    </div>
  )
}
