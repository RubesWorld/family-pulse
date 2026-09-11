'use client'

import { useRouter } from 'next/navigation'
import { UserPick, User } from '@/types/database'
import { PickCard } from '@/components/pick-card'
import { Button } from '@/components/ui/button'
import { Edit, Sparkles } from 'lucide-react'

interface MyPicksProps {
  currentPicks: UserPick[]
  userId: string
  currentUser: Pick<User, 'name' | 'avatar_url'>
}

export function MyPicks({ currentPicks, userId, currentUser }: MyPicksProps) {
  const router = useRouter()

  if (currentPicks.length === 0) {
    return (
      <div className="px-8 py-16 text-center">
        <div className="text-4xl">✨</div>
        <p className="mt-4 font-display text-xl font-bold text-ink">
          Share your favorites
        </p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13.5px] font-medium text-ink-soft">
          Let your family know what you love — food, movies, music, and more.
        </p>
        <Button
          onClick={() => router.push('/profile')}
          size="lg"
          className="mt-6"
        >
          <Sparkles className="h-4 w-4" />
          Add your picks
        </Button>
      </div>
    )
  }

  return (
    <div className="px-5">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/profile')}
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        {currentPicks.map((pick) => (
          <PickCard
            key={pick.id}
            pick={{ ...pick, interest_tag: null, users: currentUser }}
            showHistoryButton
            userId={userId}
            hideIcon
          />
        ))}
      </div>
    </div>
  )
}
