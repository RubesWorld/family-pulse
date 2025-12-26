'use client'

import { useState } from 'react'
import { PickWithUser } from '@/types/database'
import { PICK_CATEGORIES } from '@/lib/pick-categories'
import { Badge } from '@/components/ui/badge'

interface PickCardProps {
  pick: PickWithUser
  onInterestClick?: (interestTag: string) => void
  showUser?: boolean
}

export function PickCard({ pick, onInterestClick, showUser = false }: PickCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const category = PICK_CATEGORIES.find((c) => c.id === pick.category)
  if (!category) return null

  const Icon = category.icon

  return (
    <div
      className="flip-card h-48 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* Front of card */}
        <div
          className={`flip-card-front rounded-lg p-6 flex flex-col items-center justify-center text-white bg-gradient-to-br ${category.color} shadow-lg relative overflow-hidden`}
        >
          {/* Category icon - large and centered */}
          <Icon className="w-16 h-16 mb-4 opacity-90" />

          {/* Category label */}
          <h3 className="text-lg font-bold text-center">{category.label}</h3>

          {/* User info */}
          {showUser && pick.users && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                {pick.users.avatar_url ? (
                  <img
                    src={pick.users.avatar_url}
                    alt={pick.users.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium">{pick.users.name[0]}</span>
                )}
              </div>
              <span className="text-sm font-medium text-white/90">
                {pick.users.name}
              </span>
            </div>
          )}

          {/* Flip hint */}
          <div className="absolute bottom-3 right-3 text-xs text-white/60">
            Tap to reveal
          </div>
        </div>

        {/* Back of card */}
        <div className="flip-card-back rounded-lg p-6 flex flex-col bg-white border-2 border-gray-200 shadow-lg relative">
          {/* Watermark icon */}
          <Icon className="absolute top-4 right-4 w-12 h-12 text-gray-100" />

          {/* The pick value */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl font-bold text-gray-900 text-center">
              {pick.value}
            </p>
          </div>

          {/* Interest tag */}
          {pick.interest_tag && (
            <div className="mt-4">
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation()
                  onInterestClick?.(pick.interest_tag!)
                }}
              >
                {pick.interest_tag}
              </Badge>
            </div>
          )}

          {/* Flip hint */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            Tap to flip
          </div>
        </div>
      </div>

      <style jsx>{`
        .flip-card {
          perspective: 1000px;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }

        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
