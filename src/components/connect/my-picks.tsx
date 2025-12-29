'use client'

import { UserPick } from '@/types/database'
import { PickCard } from '@/components/pick-card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Edit, Sparkles } from 'lucide-react'

interface MyPicksProps {
  currentPicks: UserPick[]
  userId: string
}

export function MyPicks({ currentPicks, userId }: MyPicksProps) {
  const router = useRouter()

  if (currentPicks.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <p className="text-xl font-semibold text-gray-900 mb-2">Share Your Favorites</p>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Let your family know what you love - food, movies, music, and more!
        </p>
        <Button
          onClick={() => router.push('/profile')}
          size="lg"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Add Your Picks
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => router.push('/profile')}
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentPicks.map(pick => (
          <PickCard
            key={pick.id}
            pick={{ ...pick, interest_tag: null }}
            showHistoryButton
            userId={userId}
            hideIcon
          />
        ))}
      </div>
    </div>
  )
}
