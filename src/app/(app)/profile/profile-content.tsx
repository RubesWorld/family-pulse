'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Settings, Edit2 } from 'lucide-react'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { BioRows, hasAnyBio } from '@/components/person/bio-rows'
import { useI18n } from '@/components/i18n-provider'
import { plural } from '@/lib/i18n'
import { isSkipped } from '@/lib/pick-prompts'
import { InterestCardEditor } from '@/components/interest-card-editor'
import { PickEditor } from '@/components/pick-editor'
import { PickCard } from '@/components/pick-card'
import { InterestCard as InterestCardView } from '@/components/interest-card'
import { ProfileBioEditor } from '@/components/profile-bio-editor'
import type { Activity, InterestCard, UserPick } from '@/types/database'

interface ProfileContentProps {
  user: {
    id: string
    name: string
    email: string
    interests: string[]
    familyName: string
    inviteCode: string
    location: string | null
    occupation: string | null
    birthday: string | null
    bio: string | null
    phone_number: string | null
  }
  recentActivities: Activity[]
  interestCards: InterestCard[]
  picks: UserPick[]
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-extrabold text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink"
    >
      <Edit2 className="h-3 w-3" />
      {label}
    </button>
  )
}

/**
 * Your own page — the same three things Family shows about anyone else
 * (bio, interests, answers), with editing attached.
 *
 * Appearance, language, notifications, the invite link and logout used to sit
 * underneath all of this. They are preferences, not facts about you, and they
 * now live behind the gear in the header.
 */
export function ProfileContent({
  user,
  recentActivities,
  interestCards,
  picks,
}: ProfileContentProps) {
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [isEditingPicks, setIsEditingPicks] = useState(false)
  const router = useRouter()
  const { dict } = useI18n()

  const handleSaveComplete = () => {
    setIsEditingBio(false)
    setIsEditingInterests(false)
    setIsEditingPicks(false)
    router.refresh()
  }

  const hasBioInfo = hasAnyBio(user)
  const filledPicks = picks.filter(
    (p) => p.value && p.value.trim() && !isSkipped(p.value)
  )

  return (
    <div className="mx-auto max-w-lg">
      <header className="flex items-center gap-4 px-5 pb-2 pt-screen">
        <GlowAvatar name={user.name} userId={user.id} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[26px] font-black leading-tight tracking-tight text-ink">
            {user.name}
          </h1>
          <p className="mt-0.5 truncate text-[12px] font-bold text-ink-faint">
            {user.email}
          </p>
        </div>

        <Link
          href="/settings"
          aria-label={dict.settings.title}
          className="grid h-11 w-11 flex-none place-items-center rounded-full border-card border-edge bg-card text-ink-soft backdrop-blur-card transition-transform active:scale-95"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <div className="mt-5 flex flex-col gap-3 px-5">
        <CollapsibleSection
          title={dict.person.aboutMe}
          emoji="✍️"
          summary={hasBioInfo ? dict.person.bioSummary : dict.person.nothingAdded}
          forceOpen={isEditingBio || !hasBioInfo}
          action={
            hasBioInfo && !isEditingBio ? (
              <EditButton
                onClick={() => setIsEditingBio(true)}
                label={dict.common.edit}
              />
            ) : null
          }
        >
          {isEditingBio || !hasBioInfo ? (
            <ProfileBioEditor
              userId={user.id}
              initialData={{
                location: user.location,
                occupation: user.occupation,
                birthday: user.birthday,
                bio: user.bio,
                phone_number: user.phone_number,
              }}
              onSave={handleSaveComplete}
            />
          ) : (
            <BioRows person={user} />
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title={dict.person.interests}
          emoji="🎨"
          summary={plural(interestCards.length, {
            none: dict.person.nothingAdded,
            one: dict.person.interestOne,
            many: dict.person.interestCount,
          })}
          forceOpen={isEditingInterests || interestCards.length === 0}
          action={
            interestCards.length > 0 && !isEditingInterests ? (
              <EditButton
                onClick={() => setIsEditingInterests(true)}
                label={dict.common.edit}
              />
            ) : null
          }
        >
          {isEditingInterests || interestCards.length === 0 ? (
            <InterestCardEditor
              userId={user.id}
              existingCards={interestCards.map((card) => ({
                category: card.category,
                description: card.description,
                is_custom: card.is_custom,
                tags: card.tags || [],
              }))}
              onSave={handleSaveComplete}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {interestCards.map((card) => (
                <InterestCardView
                  key={card.id}
                  interest={{
                    ...card,
                    users: { name: user.name, avatar_url: null },
                  }}
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title={dict.picks.title}
          emoji="⭐"
          summary={plural(filledPicks.length, {
            none: dict.picks.summaryNone,
            one: dict.picks.summaryOne,
            many: dict.picks.summaryMany,
          })}
          forceOpen={isEditingPicks}
          action={
            !isEditingPicks ? (
              <EditButton
                onClick={() => setIsEditingPicks(true)}
                label={dict.common.edit}
              />
            ) : null
          }
        >
          {isEditingPicks ? (
            <PickEditor
              userId={user.id}
              existingPicks={picks.map((pick) => ({
                category: pick.category,
                value: pick.value,
                interest_tag: pick.interest_tag,
              }))}
              userInterests={interestCards.map((card) => ({
                category: card.category,
                is_custom: card.is_custom,
              }))}
              onSave={handleSaveComplete}
            />
          ) : filledPicks.length === 0 ? (
            <p className="py-4 text-center text-[13px] font-semibold text-ink-soft">
              {dict.picks.emptyMine}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filledPicks.map((pick) => (
                <PickCard
                  key={pick.id}
                  pick={{ ...pick, users: { name: user.name, avatar_url: null } }}
                  showHistoryButton
                  userId={user.id}
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {recentActivities.length > 0 && (
          <CollapsibleSection
            title={dict.person.recentActivity}
            emoji="📅"
            summary={plural(recentActivities.length, {
              none: dict.person.nothingAdded,
              one: dict.person.postOne,
              many: dict.person.postCount,
            })}
          >
            <div className="flex flex-col gap-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border-l-2 border-marigold/60 py-0.5 pl-3"
                >
                  <p className="font-display text-[15px] font-bold text-ink">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="mt-0.5 text-[12.5px] font-medium text-ink-soft">
                      {activity.description}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] font-bold text-ink-faint">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}
