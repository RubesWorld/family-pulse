'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { useI18n } from '@/components/i18n-provider'
import { plural } from '@/lib/i18n'
import { isSkipped } from '@/lib/pick-prompts'
import { InterestCardEditor } from '@/components/interest-card-editor'
import { PickEditor } from '@/components/pick-editor'
import { PickCard } from '@/components/pick-card'
import { InterestCard as InterestCardView } from '@/components/interest-card'
import { ProfileBioEditor } from '@/components/profile-bio-editor'
import { NotificationsGuide } from '@/components/profile/notifications-guide'
import { LogOut, Copy, Check, Edit2 } from 'lucide-react'
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

const BIO_ROWS: { key: 'location' | 'occupation' | 'birthday' | 'bio'; emoji: string; label: string }[] = [
  { key: 'location', emoji: '📍', label: 'Location' },
  { key: 'occupation', emoji: '💼', label: 'Work' },
  { key: 'birthday', emoji: '🎂', label: 'Birthday' },
  { key: 'bio', emoji: '✍️', label: 'Bio' },
]

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-extrabold text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink"
    >
      <Edit2 className="h-3 w-3" />
      Edit
    </button>
  )
}

export function ProfileContent({
  user,
  recentActivities,
  interestCards,
  picks,
}: ProfileContentProps) {
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [isEditingPicks, setIsEditingPicks] = useState(false)
  const router = useRouter()
  const { dict } = useI18n()

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/join/${user.inviteCode}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = inviteUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveComplete = () => {
    setIsEditingBio(false)
    setIsEditingInterests(false)
    setIsEditingPicks(false)
    router.refresh()
  }

  const hasBioInfo = !!(user.location || user.occupation || user.birthday || user.bio)
  const filledPicks = picks.filter(
    (p) => p.value && p.value.trim() && !isSkipped(p.value)
  )

  return (
    <div className="mx-auto max-w-lg">
      {/* hero */}
      <header className="flex items-center gap-4 px-5 pb-2 pt-14">
        <GlowAvatar
          name={user.name}
          userId={user.id}
          size="xl"
        />
        <div className="min-w-0">
          <h1 className="truncate font-display text-[26px] font-black leading-tight tracking-tight text-ink">
            {user.name}
          </h1>
          <p className="mt-0.5 truncate text-[12px] font-bold text-ink-faint">
            {user.email}
          </p>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-3 px-5">
        {/* Appearance — the night/day switch lives here */}
        <div className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card">
          <div className="mb-2.5 font-display text-[17px] font-bold text-ink">
            {dict.settings.appearance}
          </div>
          <ThemeToggle />

          <div className="mb-2.5 mt-4 font-display text-[17px] font-bold text-ink">
            {dict.settings.language}
          </div>
          <LanguageToggle />
        </div>

        <CollapsibleSection
          title="About me"
          emoji="✍️"
          summary={hasBioInfo ? 'Location, work, birthday, bio' : 'Nothing added yet'}
          forceOpen={isEditingBio || !hasBioInfo}
          action={
            hasBioInfo && !isEditingBio ? (
              <EditButton onClick={() => setIsEditingBio(true)} />
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
            <div className="-my-1">
              {BIO_ROWS.map(({ key, emoji, label }) => {
                const value = user[key]
                if (!value) return null
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 border-b border-dashed border-edge py-2.5 last:border-b-0"
                  >
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-paper-2 text-sm">
                      {emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">
                        {label}
                      </div>
                      <div
                        className={
                          key === 'bio'
                            ? 'mt-0.5 text-[13px] font-medium leading-relaxed text-ink-soft'
                            : 'mt-0.5 text-[13.5px] font-bold text-ink'
                        }
                      >
                        {key === 'birthday'
                          ? new Date(value).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                            })
                          : value}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Interests"
          emoji="🎨"
          summary={
            interestCards.length > 0
              ? `${interestCards.length} ${interestCards.length === 1 ? 'interest' : 'interests'}`
              : 'Nothing added yet'
          }
          forceOpen={isEditingInterests || interestCards.length === 0}
          action={
            interestCards.length > 0 && !isEditingInterests ? (
              <EditButton onClick={() => setIsEditingInterests(true)} />
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
              <EditButton onClick={() => setIsEditingPicks(true)} />
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
            title="Recent activity"
            emoji="📅"
            summary={`${recentActivities.length} recent ${
              recentActivities.length === 1 ? 'post' : 'posts'
            }`}
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

        <CollapsibleSection
          title="Notifications"
          emoji="🔔"
          summary="Push setup and troubleshooting"
        >
          <NotificationsGuide />
        </CollapsibleSection>

        {/* Family + invite stays visible — it is the main thing people come here to do */}
        <div className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card">
          <div className="font-display text-[17px] font-bold text-ink">
            {user.familyName}
          </div>
          <p className="mt-0.5 text-[12px] font-bold text-ink-faint">
            Your family group
          </p>
          <Button
            variant="outline"
            onClick={copyInviteLink}
            className="mt-3 w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Link copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy invite link
              </>
            )}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? 'Logging out…' : 'Log out'}
        </Button>
      </div>
    </div>
  )
}
