'use client'

import { User } from '@/types/database'
import { GlowAvatar } from '@/components/ui/glow-avatar'

interface FamilyMemberCardProps {
  /**
   * Only the three fields the card renders. The family query stopped selecting
   * `*`, so asking for a whole `User` here would have been asking for columns
   * nothing on this card displays.
   */
  user: Pick<User, 'id' | 'name' | 'avatar_url'>
  interestCount?: number
  pickCount?: number
  onClick: () => void
}

export function FamilyMemberCard({
  user,
  interestCount = 0,
  pickCount = 0,
  onClick,
}: FamilyMemberCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 rounded-card border-card border-edge bg-card px-3 py-4 text-center shadow-card backdrop-blur-card transition-transform active:scale-[0.97]"
    >
      <GlowAvatar
        name={user.name}
        userId={user.id}
        avatarUrl={user.avatar_url}
        size="lg"
      />

      <h3 className="font-display text-[17px] font-bold text-ink">
        {user.name}
      </h3>

      <div className="flex gap-2.5 text-[10.5px] font-extrabold text-ink-faint">
        <span>
          <span className="text-ink-soft">{interestCount}</span> interests
        </span>
        <span>
          <span className="text-ink-soft">{pickCount}</span> picks
        </span>
      </div>
    </button>
  )
}
