'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { activityKeys, fetchOwnActivities } from '@/lib/queries/activities'
import {
  fetchOwnInterestCards,
  interestCardKeys,
} from '@/lib/queries/interest-cards'
import { fetchOwnCurrentPicks, pickKeys } from '@/lib/queries/picks'
import { useSession } from '@/lib/supabase/session-context'
import { Button } from '@/components/ui/button'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { InterestCardEditor } from '@/components/interest-card-editor'
import { PickEditor } from '@/components/pick-editor'
import { PickCard } from '@/components/pick-card'
import { InterestCard as InterestCardView } from '@/components/interest-card'
import { ProfileBioEditor } from '@/components/profile-bio-editor'
import { NotificationsGuide } from '@/components/profile/notifications-guide'
import { LogOut, Copy, Check, Edit2 } from 'lucide-react'

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

/**
 * The Profile tab.
 *
 * This is the first screen where reads and writes meet. Its three reads used to
 * run in `page.tsx` on the server and every save ended in `router.refresh()` —
 * a full server round-trip and re-render to show back the rows the browser had
 * just written. Both sides now go through the cache: the editors below mutate
 * and then invalidate, and this screen re-renders from what the invalidation
 * refetched.
 *
 * That pairing is why the reads and writes had to move together. Cached reads
 * with a `router.refresh()` behind them would have shown the *old* rows after a
 * save — the refresh re-renders the server tree, which no longer fetches
 * anything.
 */
export function ProfileContent() {
  const { supabase, user, profile } = useSession()
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [isEditingPicks, setIsEditingPicks] = useState(false)
  const router = useRouter()

  const userId = user?.id ?? ''
  const enabled = Boolean(userId)

  const activitiesQuery = useQuery({
    queryKey: activityKeys.own(userId),
    queryFn: () => fetchOwnActivities(supabase, userId),
    enabled,
  })

  const interestCardsQuery = useQuery({
    queryKey: interestCardKeys.own(userId),
    queryFn: () => fetchOwnInterestCards(supabase, userId),
    enabled,
  })

  // Every current pick, not just the ones with a value. The server version read
  // the non-empty subset because that is all it displayed, but the editor needs
  // the id of each row it may have to archive, and issuing a second query for
  // the same rows to get them would be the sort of duplicate read this refactor
  // is removing. The display filter is `filledPicks`, below.
  const picksQuery = useQuery({
    queryKey: pickKeys.own(userId),
    queryFn: () => fetchOwnCurrentPicks(supabase, userId),
    enabled,
  })

  const name = profile?.name || 'User'
  const familyName = profile?.families?.name || 'Family'
  const inviteCode = profile?.families?.invite_code || ''

  const interestCards = interestCardsQuery.data ?? []
  const picks = picksQuery.data ?? []
  const recentActivities = activitiesQuery.data ?? []

  const handleLogout = async () => {
    setLoggingOut(true)
    // The session context's onAuthStateChange handler clears the cache and
    // redirects, so signing out is all this has to do.
    await supabase.auth.signOut()
    router.push('/login')
  }

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`
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

  const hasBioInfo = !!(
    profile?.location ||
    profile?.occupation ||
    profile?.birthday ||
    profile?.bio
  )
  const filledPicks = picks.filter((p) => p.value && p.value.trim())

  // Only the first uncached load. The profile itself is seeded from the layout,
  // so the hero never flashes; this covers the three reads underneath it.
  const isFirstLoad =
    enabled &&
    (interestCardsQuery.isPending ||
      picksQuery.isPending ||
      activitiesQuery.isPending)

  return (
    <div className="mx-auto max-w-lg">
      {/* hero */}
      <header className="flex items-center gap-4 px-5 pb-2 pt-14">
        <GlowAvatar name={name} userId={userId} size="xl" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-[26px] font-black leading-tight tracking-tight text-ink">
            {name}
          </h1>
          <p className="mt-0.5 truncate text-[12px] font-bold text-ink-faint">
            {user?.email ?? ''}
          </p>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-3 px-5">
        {/* Appearance — the night/day switch lives here */}
        <div className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card">
          <div className="mb-2.5 font-display text-[17px] font-bold text-ink">
            Appearance
          </div>
          <ThemeToggle />
        </div>

        {isFirstLoad ? (
          <ProfileSectionsSkeleton />
        ) : (
          <>
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
                  userId={userId}
                  initialData={{
                    location: profile?.location ?? null,
                    occupation: profile?.occupation ?? null,
                    birthday: profile?.birthday ?? null,
                    bio: profile?.bio ?? null,
                    phone_number: profile?.phone_number ?? null,
                  }}
                  onSaved={() => setIsEditingBio(false)}
                />
              ) : (
                <div className="-my-1">
                  {BIO_ROWS.map(({ key, emoji, label }) => {
                    const value = profile?.[key]
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
                  userId={userId}
                  existingCards={interestCards.map((card) => ({
                    category: card.category,
                    description: card.description,
                    is_custom: card.is_custom,
                    tags: card.tags || [],
                  }))}
                  onSaved={() => setIsEditingInterests(false)}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {interestCards.map((card) => (
                    <InterestCardView
                      key={card.id}
                      interest={{
                        ...card,
                        users: { name, avatar_url: null },
                      }}
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="My picks"
              emoji="⭐"
              summary={
                filledPicks.length > 0
                  ? `${filledPicks.length} ${filledPicks.length === 1 ? 'favorite' : 'favorites'}`
                  : 'Nothing added yet'
              }
              forceOpen={isEditingPicks}
              action={
                !isEditingPicks ? (
                  <EditButton onClick={() => setIsEditingPicks(true)} />
                ) : null
              }
            >
              {isEditingPicks ? (
                <PickEditor
                  userId={userId}
                  /* The rows themselves, not a stripped copy: the editor reads
                     its starting state and the ids it needs to archive from
                     these. It used to re-query the same rows on save. */
                  existingPicks={picks}
                  userInterests={interestCards.map((card) => ({
                    category: card.category,
                    is_custom: card.is_custom,
                  }))}
                  onSaved={() => setIsEditingPicks(false)}
                />
              ) : filledPicks.length === 0 ? (
                <p className="py-4 text-center text-[13px] font-semibold text-ink-soft">
                  No picks yet. Tap Edit to add your favorites.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filledPicks.map((pick) => (
                    <PickCard
                      key={pick.id}
                      pick={{ ...pick, users: { name, avatar_url: null } }}
                      showHistoryButton
                      userId={userId}
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
          </>
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
            {familyName}
          </div>
          <p className="mt-0.5 text-[12px] font-bold text-ink-faint">
            Your family group
          </p>
          <Button
            variant="outline"
            onClick={copyInviteLink}
            disabled={!inviteCode}
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

/**
 * Stands in for the three collapsible sections whose data is still in flight.
 * `loading.tsx` still covers the navigation itself — this covers the gap
 * between the shell painting and the queries resolving, which only exists now
 * that the reads happen in the browser.
 */
function ProfileSectionsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((section) => (
        <div
          key={section}
          className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2.5 h-3 w-44" />
        </div>
      ))}
    </>
  )
}
