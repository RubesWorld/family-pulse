'use client'

import { useState } from 'react'
import { User, PickWithUser, InterestCard, UserPick } from '@/types/database'
import { FamilyMemberCard } from '@/components/family-member-card'
import { PickCard } from '@/components/pick-card'
import { SectionHeader } from '@/components/ui/surface'
import { MemberDetailView } from './member-detail-view'

interface FamilyContentProps {
  familyName: string
  members: User[]
  recentPicks: PickWithUser[]
  /** Preloaded on the server, keyed by user id — see page.tsx. */
  interestsByMember: Record<string, InterestCard[]>
  picksByMember: Record<string, UserPick[]>
}

export function FamilyContent({
  familyName,
  members,
  recentPicks,
  interestsByMember,
  picksByMember,
}: FamilyContentProps) {
  const [selectedMember, setSelectedMember] = useState<User | null>(null)

  if (selectedMember) {
    return (
      <MemberDetailView
        member={selectedMember}
        interests={interestsByMember[selectedMember.id] ?? []}
        picks={picksByMember[selectedMember.id] ?? []}
        onBack={() => setSelectedMember(null)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="px-5 pb-1 pt-screen">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </div>
        <h1 className="mt-1 font-display text-[30px] font-black leading-[1.06] tracking-tight text-ink">
          {familyName}
        </h1>
        <svg
          aria-hidden
          viewBox="0 0 132 9"
          fill="none"
          className="mt-0.5 block h-2 w-32 text-marigold"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--marigold) / var(--glow)))',
          }}
        >
          <path
            d="M2 6.2c22-4.4 44-5.2 66-3.1 21 2 42 2.4 63-.6"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </header>

      <SectionHeader>Everyone</SectionHeader>
      <div className="grid grid-cols-2 gap-3 px-5">
        {members.map((member) => (
          <FamilyMemberCard
            key={member.id}
            user={member}
            onClick={() => setSelectedMember(member)}
          />
        ))}
      </div>

      <SectionHeader>Fresh picks</SectionHeader>
      <div className="px-5">
        {recentPicks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recentPicks.map((pick) => (
              <PickCard key={pick.id} pick={pick} showUser />
            ))}
          </div>
        ) : (
          <div className="rounded-card border-card border-edge bg-card px-6 py-10 text-center backdrop-blur-card">
            <p className="font-display text-[17px] font-bold text-ink">
              Quiet last 24 hours
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-soft">
              Share a favorite from your profile to get things going.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
