import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    // Mark subscription as inactive instead of deleting
    // This preserves history and helps detect stale subscriptions
    const { error: updateError } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (updateError) {
      console.error('Error deactivating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove subscription' },
        { status: 500 }
      )
    }

    // Check if user has any other active subscriptions
    const { data: activeSubs, error: checkError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (checkError) {
      console.error('Error checking active subscriptions:', checkError)
    }

    // If no active subscriptions remain, update notification preferences
    if (!activeSubs || activeSubs.length === 0) {
      await supabase
        .from('notification_preferences')
        .update({ push_enabled: false })
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in push unsubscribe endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
