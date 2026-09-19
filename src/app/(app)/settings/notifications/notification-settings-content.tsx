'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ensureNotificationPreferences,
  fetchNotificationPreferences,
  notificationKeys,
  updateNotificationPreferences,
  type NotificationPreferencesPatch,
} from '@/lib/queries/notifications'
import { useSession } from '@/lib/supabase/session-context'
import type { NotificationPreferences } from '@/types/database'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { EnablePushCard } from '@/components/notifications/enable-push-card'

export function NotificationSettingsContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { supabase, user } = useSession()

  const userId = user?.id ?? ''
  const preferencesKey = notificationKeys.preferences(userId)

  const preferencesQuery = useQuery({
    queryKey: preferencesKey,
    queryFn: () => fetchNotificationPreferences(supabase, userId),
    enabled: Boolean(userId),
  })

  /**
   * The row this screen edits may not exist yet, and something has to create
   * it. That used to happen in `page.tsx` during render — a GET that wrote,
   * with `force-dynamic` set so it happened on every visit.
   *
   * It is an upsert now, and it is a mutation: it runs from an effect after the
   * read has settled, not while the tree is rendering. Behaviour is otherwise
   * the same — opening this screen is still what backfills the row — so this is
   * not a fourth creation path alongside the migration's backfill and
   * `api/push/subscribe`, it is the same one made explicit.
   */
  const {
    mutate: ensurePreferences,
    reset: resetCreation,
    isPending: isCreating,
    isError: creationFailed,
  } = useMutation({
    mutationFn: () => ensureNotificationPreferences(supabase, userId),
    onSuccess: (row) => queryClient.setQueryData(preferencesKey, row),
  })

  // One attempt per mount. Without the latch a failing upsert would retry on
  // every render for as long as the screen is open.
  const creationAttempted = useRef(false)

  const { isPending: isLoadingPreferences, isError: readFailed } =
    preferencesQuery
  const preferences = preferencesQuery.data ?? null

  useEffect(() => {
    if (creationAttempted.current) return
    if (!userId || isLoadingPreferences || readFailed) return
    if (preferences) return

    creationAttempted.current = true
    ensurePreferences()
  }, [
    userId,
    isLoadingPreferences,
    readFailed,
    preferences,
    ensurePreferences,
  ])

  /**
   * One mutation behind every toggle and both time fields.
   *
   * Optimistic, because a switch that waits for a round-trip before moving
   * reads as broken. On failure the cache is rolled back, which is what makes
   * the switch visibly snap back instead of the previous behaviour — a
   * `console.error` and a control that silently disagreed with the database.
   */
  const updateMutation = useMutation({
    mutationFn: (patch: NotificationPreferencesPatch) =>
      updateNotificationPreferences(supabase, userId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: preferencesKey })

      const previous =
        queryClient.getQueryData<NotificationPreferences | null>(preferencesKey)

      if (previous) {
        queryClient.setQueryData(preferencesKey, { ...previous, ...patch })
      }

      return { previous }
    },
    onError: (_error, _patch, context) => {
      queryClient.setQueryData(preferencesKey, context?.previous ?? null)
    },
    // The stored row, not the guess: `updated_at` is set by a trigger, so the
    // optimistic copy is never quite what the database holds.
    onSuccess: (row) => queryClient.setQueryData(preferencesKey, row),
  })

  const isSaving = updateMutation.isPending
  const savePatch = (patch: NotificationPreferencesPatch) =>
    updateMutation.mutate(patch)

  // "The read came back empty" is a loading state, not an empty one — the
  // effect above is about to create the row. Only once that creation has
  // actually failed does this become something to report.
  const awaitingCreation =
    Boolean(userId) && !isLoadingPreferences && !readFailed && !preferences

  if (isLoadingPreferences || isCreating || (awaitingCreation && !creationFailed)) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="mx-auto max-w-2xl p-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-coral" />
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    // Previously unreachable as a visible state: a failed read left
    // `preferences` null and the screen spun forever.
    return (
      <div className="min-h-screen bg-paper">
        <div className="mx-auto max-w-2xl p-4 pt-12">
          <div className="rounded-card border-card border-edge bg-card px-6 py-12 text-center backdrop-blur-card">
            <p className="font-display text-lg font-bold text-ink">
              Couldn&apos;t load your notification settings
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
              Check your connection and try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                creationAttempted.current = false
                resetCreation()
                preferencesQuery.refetch()
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="mx-auto max-w-2xl p-4 pt-12">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-[26px] font-black tracking-tight text-ink">
            Notifications
          </h1>
        </div>

        {updateMutation.isError && (
          <p className="mb-4 text-[12.5px] font-bold text-destructive">
            That change didn&apos;t save. Please try again.
          </p>
        )}

        <div className="space-y-6">
          {/* Push Notification Enable/Disable */}
          <div>
            <EnablePushCard variant="card" />
          </div>

          {/* Notification Types */}
          <div className="overflow-hidden rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
            <div className="border-b border-edge bg-paper-2 p-4">
              <h2 className="font-display text-[15px] font-bold text-ink">What to notify me about</h2>
              <p className="mt-1 text-[12px] font-medium text-ink-soft">
                Choose which events you want to be notified about
              </p>
            </div>

            <div className="divide-y divide-edge">
              {/* Tier 1: Critical */}
              <div className="p-4">
                <p className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-coral">
                  Critical updates
                </p>
                <div className="space-y-3">
                  <NotificationToggle
                    label="Your Turn to Ask"
                    description="When it's your turn to choose the weekly question"
                    checked={preferences.notify_your_turn}
                    onChange={(checked) => savePatch({ notify_your_turn: checked })}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="Pending Question Reminder"
                    description="Reminder to choose a question when it's pending"
                    checked={preferences.notify_pending_reminder}
                    onChange={(checked) => savePatch({ notify_pending_reminder: checked })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Tier 2: Engagement */}
              <div className="p-4">
                <p className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-denim">
                  Family engagement
                </p>
                <div className="space-y-3">
                  <NotificationToggle
                    label="Last to Answer"
                    description="When you're the last one who hasn't answered"
                    checked={preferences.notify_last_to_answer}
                    onChange={(checked) => savePatch({ notify_last_to_answer: checked })}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="Weekly Digest"
                    description="Summary of family activity each week"
                    checked={preferences.notify_weekly_digest}
                    onChange={(checked) => savePatch({ notify_weekly_digest: checked })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Tier 3: Nice-to-have */}
              <div className="p-4">
                <p className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">
                  Optional updates
                </p>
                <div className="space-y-3">
                  <NotificationToggle
                    label="New Activities"
                    description="When family members share new activities"
                    checked={preferences.notify_activities}
                    onChange={(checked) => savePatch({ notify_activities: checked })}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="New Answers"
                    description="When family members answer questions"
                    checked={preferences.notify_answers}
                    onChange={(checked) => savePatch({ notify_answers: checked })}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="New Picks"
                    description="When family members update their picks"
                    checked={preferences.notify_picks}
                    onChange={(checked) => savePatch({ notify_picks: checked })}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="overflow-hidden rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
            <div className="border-b border-edge bg-paper-2 p-4">
              <h2 className="font-display text-[15px] font-bold text-ink">Quiet hours</h2>
              <p className="mt-1 text-[12px] font-medium text-ink-soft">
                Don&apos;t send notifications during these hours
              </p>
            </div>

            <div className="p-4 space-y-4">
              <NotificationToggle
                label="Enable Quiet Hours"
                description="Pause notifications during your quiet hours"
                checked={preferences.quiet_hours_enabled}
                onChange={(checked) => savePatch({ quiet_hours_enabled: checked })}
                disabled={isSaving}
              />

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-ink-soft">
                      Start time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => savePatch({ quiet_hours_start: e.target.value })}
                      disabled={isSaving}
                      className="w-full rounded-field border-card border-edge bg-field px-3 py-2.5 text-[14px] font-semibold text-ink focus:border-coral focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-ink-soft">
                      End time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => savePatch({ quiet_hours_end: e.target.value })}
                      disabled={isSaving}
                      className="w-full rounded-field border-card border-edge bg-field px-3 py-2.5 text-[14px] font-semibold text-ink focus:border-coral focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notification Methods */}
          <div className="overflow-hidden rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
            <div className="border-b border-edge bg-paper-2 p-4">
              <h2 className="font-display text-[15px] font-bold text-ink">How to reach me</h2>
              <p className="mt-1 text-[12px] font-medium text-ink-soft">
                Choose how you want to receive notifications
              </p>
            </div>

            <div className="p-4 space-y-3">
              <NotificationToggle
                label="Push Notifications"
                description="Browser notifications on this device"
                checked={preferences.push_enabled}
                onChange={(checked) => savePatch({ push_enabled: checked })}
                disabled={isSaving}
              />
              <NotificationToggle
                label="Email Notifications"
                description="Send notifications to your email (coming soon)"
                checked={preferences.email_enabled}
                onChange={(checked) => savePatch({ email_enabled: checked })}
                disabled={true}
              />
              <NotificationToggle
                label="SMS Notifications"
                description="Send notifications via text message (coming soon)"
                checked={preferences.sms_enabled}
                onChange={(checked) => savePatch({ sms_enabled: checked })}
                disabled={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NotificationToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: NotificationToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-[13.5px] font-extrabold text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] font-medium text-ink-soft">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-coral' : 'bg-paper-2'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
