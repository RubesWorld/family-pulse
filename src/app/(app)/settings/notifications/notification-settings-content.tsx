'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { NotificationPreferences } from '@/types/database'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { EnablePushCard } from '@/components/notifications/enable-push-card'
import { useI18n } from '@/components/i18n-provider'

interface NotificationSettingsContentProps {
  preferences: NotificationPreferences | null
}

export function NotificationSettingsContent({
  preferences: initialPreferences,
}: NotificationSettingsContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [preferences, setPreferences] = useState(initialPreferences)
  const [isSaving, setIsSaving] = useState(false)
  const { dict } = useI18n()

  const handleToggle = async (field: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    setIsSaving(true)

    const { error } = await supabase
      .from('notification_preferences')
      .update({ [field]: value })
      .eq('user_id', preferences.user_id)

    if (error) {
      console.error('Error updating notification preferences:', error)
    } else {
      setPreferences({ ...preferences, [field]: value })
    }

    setIsSaving(false)
  }

  const handleTimeChange = async (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!preferences) return

    setIsSaving(true)

    const { error } = await supabase
      .from('notification_preferences')
      .update({ [field]: value })
      .eq('user_id', preferences.user_id)

    if (error) {
      console.error('Error updating quiet hours:', error)
    } else {
      setPreferences({ ...preferences, [field]: value })
    }

    setIsSaving(false)
  }

  if (!preferences) {
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

  return (
    <div className="min-h-screen bg-paper pb-20">
      <div className="mx-auto max-w-2xl p-4 pt-screen">
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
            {dict.notify.title}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Push Notification Enable/Disable */}
          <div>
            <EnablePushCard variant="card" />
          </div>

          {/* Notification Types */}
          <div className="overflow-hidden rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
            <div className="border-b border-edge bg-paper-2 p-4">
              <h2 className="font-display text-[15px] font-bold text-ink">{dict.notify.whatAbout}</h2>
              <p className="mt-1 text-[12px] font-medium text-ink-soft">
                {dict.notify.whatAboutHint}
              </p>
            </div>

            <div className="divide-y divide-edge">
              {/* Tier 1: Critical */}
              <div className="p-4">
                <p className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-coral">
                  {dict.notify.critical}
                </p>
                <div className="space-y-3">
                  <NotificationToggle
                    label={dict.notify.yourTurn}
                    description={dict.notify.yourTurnHint}
                    checked={preferences.notify_your_turn}
                    onChange={(checked) => handleToggle('notify_your_turn', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label={dict.notify.pendingReminder}
                    description={dict.notify.pendingReminderHint}
                    checked={preferences.notify_pending_reminder}
                    onChange={(checked) => handleToggle('notify_pending_reminder', checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Tier 2: Engagement */}
              <div className="p-4">
                <p className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-denim">
                  {dict.notify.engagement}
                </p>
                <div className="space-y-3">
                  <NotificationToggle
                    label={dict.notify.lastToAnswer}
                    description={dict.notify.lastToAnswerHint}
                    checked={preferences.notify_last_to_answer}
                    onChange={(checked) => handleToggle('notify_last_to_answer', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label={dict.notify.weeklyDigest}
                    description={dict.notify.weeklyDigestHint}
                    checked={preferences.notify_weekly_digest}
                    onChange={(checked) => handleToggle('notify_weekly_digest', checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Tier 3: Nice-to-have */}
              <div className="p-4">
                <p className="mb-3 text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">
                  {dict.notify.optional}
                </p>
                <div className="space-y-3">
                  <NotificationToggle
                    label={dict.notify.newActivities}
                    description={dict.notify.newActivitiesHint}
                    checked={preferences.notify_activities}
                    onChange={(checked) => handleToggle('notify_activities', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label={dict.notify.newAnswers}
                    description={dict.notify.newAnswersHint}
                    checked={preferences.notify_answers}
                    onChange={(checked) => handleToggle('notify_answers', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label={dict.notify.newPicks}
                    description={dict.notify.newPicksHint}
                    checked={preferences.notify_picks}
                    onChange={(checked) => handleToggle('notify_picks', checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="overflow-hidden rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
            <div className="border-b border-edge bg-paper-2 p-4">
              <h2 className="font-display text-[15px] font-bold text-ink">{dict.notify.quietHours}</h2>
              <p className="mt-1 text-[12px] font-medium text-ink-soft">
                {dict.notify.quietHoursHint}
              </p>
            </div>

            <div className="p-4 space-y-4">
              <NotificationToggle
                label={dict.notify.enableQuietHours}
                description={dict.notify.enableQuietHoursHint}
                checked={preferences.quiet_hours_enabled}
                onChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
                disabled={isSaving}
              />

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-ink-soft">
                      {dict.notify.startTime}
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                      disabled={isSaving}
                      className="w-full rounded-field border-card border-edge bg-field px-3 py-2.5 text-[14px] font-semibold text-ink focus:border-coral focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-ink-soft">
                      {dict.notify.endTime}
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
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
              <h2 className="font-display text-[15px] font-bold text-ink">{dict.notify.howToReach}</h2>
              <p className="mt-1 text-[12px] font-medium text-ink-soft">
                {dict.notify.howToReachHint}
              </p>
            </div>

            <div className="p-4 space-y-3">
              <NotificationToggle
                label={dict.notify.pushMethod}
                description={dict.notify.pushMethodHint}
                checked={preferences.push_enabled}
                onChange={(checked) => handleToggle('push_enabled', checked)}
                disabled={isSaving}
              />
              <NotificationToggle
                label={dict.notify.emailMethod}
                description={dict.notify.emailMethodHint}
                checked={preferences.email_enabled}
                onChange={(checked) => handleToggle('email_enabled', checked)}
                disabled={true}
              />
              <NotificationToggle
                label={dict.notify.smsMethod}
                description={dict.notify.smsMethodHint}
                checked={preferences.sms_enabled}
                onChange={(checked) => handleToggle('sms_enabled', checked)}
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
