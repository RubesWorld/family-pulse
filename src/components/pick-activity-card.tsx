'use client'

import { PickWithUser } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { PICK_CATEGORIES } from '@/lib/pick-categories'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PickActivityCardProps {
  pick: PickWithUser & { previous_value?: string | null }
}

export function PickActivityCard({ pick }: PickActivityCardProps) {
  const category = PICK_CATEGORIES.find(c => c.id === pick.category)
  const Icon = category?.icon
  const userName = pick.users?.name || 'Someone'

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon with gradient background */}
          {Icon && category && (
            <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color} flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium text-gray-900">{userName}</span>{' '}
              {pick.previous_value ? 'changed' : 'just added'}
            </p>
            <p className="font-semibold text-base mb-1">{category?.label || pick.category}</p>

            {/* Show change if there's a previous value */}
            {pick.previous_value ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 line-through">{pick.previous_value}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-900">{pick.value}</span>
              </div>
            ) : (
              <p className="text-gray-700">{pick.value}</p>
            )}

            {/* Interest tag */}
            {pick.interest_tag && (
              <Badge variant="outline" className="mt-2">
                → {pick.interest_tag}
              </Badge>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-400 mt-2">
              {formatDistanceToNow(new Date(pick.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
