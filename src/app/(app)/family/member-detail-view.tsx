'use client'

import { useState } from 'react'
import { User, InterestCard, UserPick } from '@/types/database'
import { InterestCard as InterestCardComponent } from '@/components/interest-card'
import { PickCard } from '@/components/pick-card'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/surface'
import { BioRows, hasAnyBio } from '@/components/person/bio-rows'
import { useI18n } from '@/components/i18n-provider'
import { t } from '@/lib/i18n'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { openSMS } from '@/lib/sms'

interface MemberDetailViewProps {
  member: User
  /**
   * Preloaded by the family page rather than fetched here on mount. This used to
   * run two sequential queries inside a useEffect, so tapping a member showed a
   * skeleton while two more round-trips completed. The server already knows the
   * family, so it fetches everyone's cards alongside the member list.
   */
  interests: InterestCard[]
  picks: UserPick[]
  onBack: () => void
}

export function MemberDetailView({
  member,
  interests,
  picks,
  onBack,
}: MemberDetailViewProps) {
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const { dict } = useI18n()

  const filteredPicks = selectedInterest
    ? picks.filter((p) => p.interest_tag === selectedInterest)
    : picks

  const hasBioInfo = hasAnyBio(member)

  const handleTextClick = () => {
    if (!member.phone_number) return
    openSMS(member.phone_number, `Hey ${member.name}!`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="px-5 pt-12">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
          <ArrowLeft className="h-4 w-4" />
          Family
        </Button>
      </div>

      <header className="flex items-center justify-between gap-3 px-5 pt-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <GlowAvatar
            name={member.name}
            userId={member.id}
            avatarUrl={member.avatar_url}
            size="xl"
          />
          <h1 className="truncate font-display text-[26px] font-black tracking-tight text-ink">
            {member.name}
          </h1>
        </div>
        {member.phone_number && (
          <Button variant="outline" size="sm" onClick={handleTextClick}>
            <MessageCircle className="h-3.5 w-3.5" />
            Text
          </Button>
        )}
      </header>

      {hasBioInfo && (
        <>
          <SectionHeader>
            {t(dict.person.aboutSomeone, { name: member.name.split(' ')[0] })}
          </SectionHeader>
          <div className="px-5">
            <div className="rounded-card border-card border-edge bg-card px-4 shadow-card backdrop-blur-card">
              <BioRows person={member} />
            </div>
          </div>
        </>
      )}

      {interests.length > 0 && (
        <>
          <SectionHeader>{dict.person.interests}</SectionHeader>
          <div className="flex flex-col gap-3 px-5">
            {interests.map((interest) => (
              <InterestCardComponent
                key={interest.id}
                interest={{
                  ...interest,
                  users: { name: member.name, avatar_url: member.avatar_url },
                }}
                onClick={() =>
                  setSelectedInterest(
                    selectedInterest === interest.category
                      ? null
                      : interest.category
                  )
                }
                isSelected={selectedInterest === interest.category}
              />
            ))}
          </div>
        </>
      )}

      {filteredPicks.length > 0 && (
        <>
          <SectionHeader>{dict.picks.title}</SectionHeader>
          <div className="grid grid-cols-2 gap-3 px-5">
            {filteredPicks.map((pick) => (
              <PickCard
                key={pick.id}
                pick={{
                  ...pick,
                  users: { name: member.name, avatar_url: member.avatar_url },
                }}
                onInterestClick={(tag) => setSelectedInterest(tag)}
              />
            ))}
          </div>
        </>
      )}

      {interests.length === 0 && picks.length === 0 && (
        <div className="px-8 py-16 text-center">
          <div className="text-4xl">🫥</div>
          <p className="mt-4 font-display text-lg font-bold text-ink">
            Nothing shared yet
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
            {member.name} hasn&apos;t added interests or picks.
          </p>
        </div>
      )}
    </div>
  )
}
