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
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with emoji and label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{emoji}</span>
          <h3 className="font-bold text-gray-900">{label}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-3">
          {interest.description}
        </p>

        {/* User info */}
        {showUser && interest.users && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {interest.users.avatar_url ? (
                <img
                  src={interest.users.avatar_url}
                  alt={interest.users.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-gray-600">
                  {interest.users.name[0]}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{interest.users.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
