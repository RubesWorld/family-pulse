import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Initialize web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:noreply@familypulse.app'

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

// Create Supabase client with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SendPushNotificationParams {
  userId: string
  notificationType: string
  title: string
  body: string
  url?: string
  questionId?: string
  activityId?: string
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(
  quietStart: string,
  quietEnd: string,
  userTimezone: string = 'America/New_York'
): boolean {
  try {
    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
    })

    // Handle quiet hours that span midnight
    if (quietStart > quietEnd) {
      return currentTime >= quietStart || currentTime <= quietEnd
    } else {
      return currentTime >= quietStart && currentTime <= quietEnd
    }
  } catch (error) {
    console.error('Error checking quiet hours:', error)
    return false
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification({
  userId,
  notificationType,
  title,
  body,
  url,
  questionId,
  activityId,
}: SendPushNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get user's notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (prefsError || !preferences) {
      console.error('Error fetching notification preferences:', prefsError)
      return { success: false, error: 'User preferences not found' }
    }

    // 2. Check if push notifications are enabled
    if (!preferences.push_enabled) {
      return { success: false, error: 'Push notifications disabled for user' }
    }

    // 3. Check quiet hours
    if (preferences.quiet_hours_enabled) {
      const inQuietHours = isQuietHours(
        preferences.quiet_hours_start,
        preferences.quiet_hours_end
      )

      if (inQuietHours) {
        console.log(`Skipping notification for user ${userId} - quiet hours`)
        return { success: false, error: 'Quiet hours active' }
      }
    }

    // 4. Check notification type preferences
    const notificationTypeMap: Record<string, keyof typeof preferences> = {
      your_turn: 'notify_your_turn',
      pending_reminder: 'notify_pending_reminder',
      last_to_answer: 'notify_last_to_answer',
      weekly_digest: 'notify_weekly_digest',
      new_activity: 'notify_activities',
      new_answer: 'notify_answers',
      new_pick: 'notify_picks',
    }

    const preferenceKey = notificationTypeMap[notificationType]
    if (preferenceKey && !preferences[preferenceKey]) {
      return { success: false, error: `User disabled ${notificationType} notifications` }
    }

    // 5. Get active push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (subsError || !subscriptions || subscriptions.length === 0) {
      console.error('Error fetching subscriptions:', subsError)
      return { success: false, error: 'No active subscriptions found' }
    }

    // 6. Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/connect',
      questionId,
      activityId,
    })

    // 7. Send to all subscriptions
    let successCount = 0
    let failureCount = 0

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        }

        await webpush.sendNotification(pushSubscription, payload)
        successCount++

        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id)
      } catch (error: unknown) {
        failureCount++
        console.error('Error sending to subscription:', error)

        // If subscription is invalid (410 Gone or 404 Not Found), mark as inactive
        if (
          error &&
          typeof error === 'object' &&
          'statusCode' in error &&
          (error.statusCode === 410 || error.statusCode === 404)
        ) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id)
        }
      }
    }

    // 8. Log the notification
    if (successCount > 0) {
      await supabase.from('notification_log').insert({
        user_id: userId,
        notification_type: notificationType,
        title,
        body,
        related_question_id: questionId || null,
        related_activity_id: activityId || null,
        delivery_method: 'push',
        delivered_at: new Date().toISOString(),
      })
    }

    console.log(
      `Push notification sent to ${successCount}/${subscriptions.length} subscriptions`
    )

    return {
      success: successCount > 0,
      error: failureCount > 0 ? `Failed to send to ${failureCount} subscriptions` : undefined,
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error)
    return { success: false, error: 'Internal error' }
  }
}
