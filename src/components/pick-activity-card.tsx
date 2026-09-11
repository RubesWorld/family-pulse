'use client'

import { formatDistanceToNow } from 'date-fns'
import { PickWithUser } from '@/types/database'
import { getPickCategory } from '@/lib/pick-categories'
import { PickSticker } from '@/components/ui/pick-sticker'
import { Surface } from '@/components/ui/surface'

interface PickActivityCardProps {
  pick: PickWithUser & { previous_value?: string | null }
  tilt?: 'a' | 'b'
}

export function PickActivityCard({ pick, tilt }: PickActivityCardProps) {
  const category = getPickCategory(pick.category)
  const userName = pick.users?.name || 'Someone'

  return (
    <Surface tilt={tilt}>
      <div className="flex items-start gap-3.5">
        <PickSticker category={pick.category} size="md" />

        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-bold text-ink-soft">
            <span className="font-extrabold text-ink">{userName}</span>{' '}
            {pick.previous_value ? 'switched it up' : 'just added'}
          </p>

          <p className="mt-0.5 font-display text-[17px] font-bold text-ink">
            {category?.label || pick.category}
          </p>

          {pick.previous_value ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              <span className="text-[14px] font-semibold text-ink-faint line-through">
                {pick.previous_value}
              </span>
              <span
                aria-hidden
                className="font-black text-marigold"
                style={{
                  textShadow:
                    '0 0 12px hsl(var(--marigold) / calc(1 * var(--glow)))',
                }}
              >
                →
              </span>
              <span className="text-[15px] font-extrabold text-ink">
                {pick.value}
              </span>
            </div>
          ) : (
            <p className="mt-1.5 text-[15px] font-extrabold text-ink">
              {pick.value}
            </p>
          )}

          {pick.interest_tag && (
            <span className="mt-2.5 inline-block rounded-full border border-sage/30 bg-sage/[0.16] px-2.5 py-1 text-[11px] font-extrabold text-sage">
              {pick.interest_tag}
            </span>
          )}

          <p className="mt-2 text-[11px] font-bold text-ink-faint">
            {formatDistanceToNow(new Date(pick.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Surface>
  )
}
