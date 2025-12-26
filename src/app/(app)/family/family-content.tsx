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

      {/* Recent Picks Section */}
      {recentPicks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Recent Picks</h2>
          <div className="grid grid-cols-2 gap-4">
            {recentPicks.map(pick => (
              <PickCard key={pick.id} pick={pick} showUser />
            ))}
          </div>
        </section>
      )}

      {/* Family Members Grid */}
      <section>
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
    </div>
  )
}
