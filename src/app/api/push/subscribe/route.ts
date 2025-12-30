import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { subscription, userAgent } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: userAgent || null,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: userAgent || null,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error creating subscription:', insertError)
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        )
      }
    }

    // Create default notification preferences if they don't exist
    const { data: existingPrefs } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existingPrefs) {
      const { error: prefsError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          push_enabled: true,
        })

      if (prefsError) {
        console.error('Error creating notification preferences:', prefsError)
        // Don't fail the request if preferences creation fails
      }
    } else {
      // Update push_enabled to true
      const { error: updatePrefsError } = await supabase
        .from('notification_preferences')
        .update({ push_enabled: true })
        .eq('user_id', user.id)

      if (updatePrefsError) {
        console.error('Error updating notification preferences:', updatePrefsError)
        // Don't fail the request if preferences update fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in push subscribe endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
