'use client'

import { useState } from 'react'
import { User, PickWithUser } from '@/types/database'
import { FamilyMemberCard } from '@/components/family-member-card'
import { PickCard } from '@/components/pick-card'
import { MemberDetailView } from './member-detail-view'

interface FamilyContentProps {
  familyName: string
  members: User[]
  recentPicks: PickWithUser[]
}

export function FamilyContent({ familyName, members, recentPicks }: FamilyContentProps) {
  const [selectedMember, setSelectedMember] = useState<User | null>(null)

  if (selectedMember) {
    return (
      <MemberDetailView
        member={selectedMember}
        onBack={() => setSelectedMember(null)}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">{familyName}</h1>

      {/* Family Members Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Family Members</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {members.map(member => (
            <FamilyMemberCard
              key={member.id}
              user={member}
              onClick={() => setSelectedMember(member)}
            />
          ))}
        </div>
      </section>

      {/* Recent Picks Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Picks</h2>
        {recentPicks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentPicks.map(pick => (
              <PickCard key={pick.id} pick={pick} showUser />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No recent picks from the last 24 hours</p>
            <p className="text-sm text-gray-400 mt-1">
              Share your favorites in your profile!
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
