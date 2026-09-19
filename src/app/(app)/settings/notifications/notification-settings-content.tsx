'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { NotificationPreferences } from '@/types/database'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { EnablePushCard } from '@/components/notifications/enable-push-card'

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
            Notifications
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
                    onChange={(checked) => handleToggle('notify_your_turn', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="Pending Question Reminder"
                    description="Reminder to choose a question when it's pending"
                    checked={preferences.notify_pending_reminder}
                    onChange={(checked) => handleToggle('notify_pending_reminder', checked)}
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
                    onChange={(checked) => handleToggle('notify_last_to_answer', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="Weekly Digest"
                    description="Summary of family activity each week"
                    checked={preferences.notify_weekly_digest}
                    onChange={(checked) => handleToggle('notify_weekly_digest', checked)}
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
                    onChange={(checked) => handleToggle('notify_activities', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="New Answers"
                    description="When family members answer questions"
                    checked={preferences.notify_answers}
                    onChange={(checked) => handleToggle('notify_answers', checked)}
                    disabled={isSaving}
                  />
                  <NotificationToggle
                    label="New Picks"
                    description="When family members update their picks"
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
                onChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
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
                      onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
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
                onChange={(checked) => handleToggle('push_enabled', checked)}
                disabled={isSaving}
              />
              <NotificationToggle
                label="Email Notifications"
                description="Send notifications to your email (coming soon)"
                checked={preferences.email_enabled}
                onChange={(checked) => handleToggle('email_enabled', checked)}
                disabled={true}
              />
              <NotificationToggle
                label="SMS Notifications"
                description="Send notifications via text message (coming soon)"
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
