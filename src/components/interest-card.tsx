'use client'

import { InterestCardWithUser } from '@/types/database'
import { PRESET_INTERESTS } from '@/lib/interests'
import { Card, CardContent } from '@/components/ui/card'

interface InterestCardProps {
  interest: InterestCardWithUser
  onClick?: () => void
  showUser?: boolean
  isSelected?: boolean
}

export function InterestCard({ interest, onClick, showUser = false, isSelected = false }: InterestCardProps) {
  const preset = PRESET_INTERESTS.find((p) => p.id === interest.category)
  const emoji = preset?.emoji || '⭐'
  const label = preset?.label || interest.category

  return (
    <Card
      className={`
        relative overflow-hidden cursor-pointer transition-all
        bg-gradient-to-br from-white via-white to-blue-50/30
        border-2
        ${isSelected
          ? 'ring-4 ring-blue-400 shadow-2xl border-blue-300 scale-105'
          : 'hover:shadow-xl hover:scale-[1.02] border-gray-200 hover:border-blue-200'
        }
      `}
      onClick={onClick}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-tr-full" />

      <CardContent className="p-6 relative z-10">
        {/* User info at top if shown */}
        {showUser && interest.users && (
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gradient-to-r from-blue-100 to-purple-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-white">
              {interest.users.avatar_url ? (
                <img
                  src={interest.users.avatar_url}
                  alt={interest.users.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {interest.users.name[0]}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-700">{interest.users.name}</span>
          </div>
        )}

        {/* Large centered emoji with decorative background */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center mb-3 shadow-lg ring-4 ring-white/50 relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-200/20 to-purple-200/20" />
            <span className="text-6xl drop-shadow-sm relative z-10">{emoji}</span>
          </div>
          <h3 className="font-bold text-2xl text-gray-900 tracking-tight">{label}</h3>
        </div>

        {/* Description with decorative container */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-100/50 shadow-inner relative">
          <div className="absolute top-1 left-1 w-2 h-2 bg-blue-400/30 rounded-full" />
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-purple-400/30 rounded-full" />
          <p className="text-sm text-gray-700 leading-relaxed text-center">
            {interest.description}
          </p>
        </div>
      </CardContent>

      {/* Subtle shimmer effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/5 via-transparent to-purple-400/5 pointer-events-none" />
    </Card>
  )
}
