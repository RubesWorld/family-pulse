import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { sendPushNotification } from '@/lib/send-push'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Send test notification
    const result = await sendPushNotification({
      userId: user.id,
      notificationType: 'your_turn',
      title: 'Test Notification 🧪',
      body: 'This is a test push notification from Family Pulse!',
      url: '/connect',
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Test notification sent!' })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
