'use client'

import { PickWithUser } from '@/types/database'
import { getPickCategory } from '@/lib/pick-categories'
import { PickSticker } from '@/components/ui/pick-sticker'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { PickHistoryDialog } from '@/components/pick-history-dialog'

interface PickCardProps {
  pick: PickWithUser
  onInterestClick?: (interestTag: string) => void
  showUser?: boolean
  showHistoryButton?: boolean
  userId?: string
  hideIcon?: boolean
}

export function PickCard({
  pick,
  onInterestClick,
  showUser = false,
  showHistoryButton = false,
  userId,
  hideIcon = false,
}: PickCardProps) {
  const category = getPickCategory(pick.category)
  if (!category) return null

  return (
    <div className="flex flex-col rounded-panel border-card border-edge bg-card p-3.5 shadow-card backdrop-blur-card">
      {!hideIcon && <PickSticker category={pick.category} size="sm" />}

      <h4
        className={`text-[10px] font-extrabold uppercase tracking-[0.11em] text-ink-faint ${
          hideIcon ? '' : 'mt-2.5'
        }`}
      >
        {category.short}
      </h4>
      <p className="mt-0.5 break-words text-[15px] font-extrabold leading-tight text-ink">
        {pick.value}
      </p>

      {showUser && pick.users && (
        <div className="mt-2.5 flex items-center gap-2">
          <GlowAvatar
            name={pick.users.name}
            userId={pick.user_id}
            avatarUrl={pick.users.avatar_url}
            size="xs"
          />
          <span className="text-[11.5px] font-extrabold text-ink-soft">
            {pick.users.name}
          </span>
        </div>
      )}

      {pick.interest_tag && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onInterestClick?.(pick.interest_tag!)
          }}
          className="mt-2.5 self-start rounded-full border border-sage/30 bg-sage/[0.16] px-2.5 py-1 text-[10.5px] font-extrabold text-sage transition-opacity hover:opacity-80"
        >
          {pick.interest_tag}
        </button>
      )}

      {showHistoryButton && userId && (
        <div className="mt-3 border-t border-edge pt-2.5">
          <PickHistoryDialog
            userId={userId}
            category={pick.category}
            currentValue={pick.value}
          />
        </div>
      )}
    </div>
  )
}
