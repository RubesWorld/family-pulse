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
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Push Notification Enable/Disable */}
          <div>
            <EnablePushCard variant="card" />
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">What to Notify Me About</h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose which events you want to be notified about
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Tier 1: Critical */}
              <div className="p-4">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">
                  Critical Updates
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
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                  Family Engagement
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
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Optional Updates
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Quiet Hours</h2>
              <p className="text-xs text-gray-500 mt-1">
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notification Methods */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Notification Methods</h2>
              <p className="text-xs text-gray-500 mt-1">
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
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-purple-600' : 'bg-gray-200'
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
