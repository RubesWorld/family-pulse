'use client'

import { PickWithUser } from '@/types/database'
import { PICK_CATEGORIES } from '@/lib/pick-categories'
import { Badge } from '@/components/ui/badge'

interface PickCardProps {
  pick: PickWithUser
  onInterestClick?: (interestTag: string) => void
  showUser?: boolean
}

export function PickCard({ pick, onInterestClick, showUser = false }: PickCardProps) {
  const category = PICK_CATEGORIES.find((c) => c.id === pick.category)
  if (!category) return null

  const Icon = category.icon

  return (
    <div
      className="rounded-xl p-5 bg-white border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow"
    >
      {/* Header with icon and category */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {category.label}
          </h4>
          <p className="text-lg font-bold text-gray-900 leading-tight">
            {pick.value}
          </p>
        </div>
      </div>

      {/* User info */}
      {showUser && pick.users && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {pick.users.avatar_url ? (
              <img
                src={pick.users.avatar_url}
                alt={pick.users.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-gray-600">{pick.users.name[0]}</span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {pick.users.name}
          </span>
        </div>
      )}

      {/* Interest tag */}
      {pick.interest_tag && (
        <div className="mt-auto">
          <Badge
            variant="outline"
            className="text-xs cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onInterestClick?.(pick.interest_tag!)
            }}
          >
            → {pick.interest_tag}
          </Badge>
        </div>
      )}
    </div>
  )
}
