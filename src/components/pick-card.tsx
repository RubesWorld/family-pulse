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
      className="flip-card h-56 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* Front of card */}
        <div
          className={`flip-card-front rounded-xl p-6 flex flex-col items-center justify-center text-white bg-gradient-to-br ${category.color} shadow-2xl relative overflow-hidden border-4 border-white/20`}
        >
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl" />
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-lg" />

          {/* Category icon in decorative container */}
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg ring-2 ring-white/30 relative z-10">
            <Icon className="w-12 h-12 drop-shadow-lg" />
          </div>

          {/* Category label with better styling */}
          <h3 className="text-xl font-bold text-center tracking-wide drop-shadow-md relative z-10">
            {category.label}
          </h3>

          {/* User info */}
          {showUser && pick.users && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center overflow-hidden ring-1 ring-white/40">
                {pick.users.avatar_url ? (
                  <img
                    src={pick.users.avatar_url}
                    alt={pick.users.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold">{pick.users.name[0]}</span>
                )}
              </div>
              <span className="text-xs font-semibold text-white drop-shadow">
                {pick.users.name}
              </span>
            </div>
          )}

          {/* Flip hint */}
          <div className="absolute bottom-3 right-3 text-xs text-white/70 font-medium">
            ✨ Tap to reveal
          </div>
        </div>

        {/* Back of card */}
        <div className="flip-card-back rounded-xl p-6 flex flex-col bg-gradient-to-br from-white to-gray-50 border-4 border-gray-200 shadow-2xl relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30" />

          {/* Decorative corner accents */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-300 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-purple-300 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-purple-300 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-blue-300 rounded-br-lg" />

          {/* Watermark icon */}
          <Icon className="absolute top-3 right-3 w-16 h-16 text-gray-100" />

          {/* Category label at top */}
          <div className="text-center mb-3 relative z-10">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {category.label}
            </span>
          </div>

          {/* The pick value in decorative container */}
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 border-blue-200 shadow-inner max-w-full">
              <p className="text-2xl font-bold text-gray-900 text-center leading-tight">
                {pick.value}
              </p>
            </div>
          </div>

          {/* Interest tag */}
          {pick.interest_tag && (
            <div className="mt-4 flex justify-center relative z-10">
              <Badge
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all px-3 py-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onInterestClick?.(pick.interest_tag!)
                }}
              >
                → {pick.interest_tag}
              </Badge>
            </div>
          )}

          {/* Flip hint */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
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
