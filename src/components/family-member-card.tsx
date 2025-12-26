'use client'

import { User } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

interface FamilyMemberCardProps {
  user: User
  interestCount?: number
  pickCount?: number
  onClick: () => void
}

export function FamilyMemberCard({ user, interestCount = 0, pickCount = 0, onClick }: FamilyMemberCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden mb-3 shadow-md">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-white">
              {user.name[0]}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-900 mb-2">{user.name}</h3>

        {/* Counts */}
        <div className="flex gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">{interestCount}</span>
            <span>interests</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">{pickCount}</span>
            <span>picks</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
