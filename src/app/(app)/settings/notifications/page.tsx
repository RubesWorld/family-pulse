import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'
import { NotificationSettingsContent } from './notification-settings-content'

export const dynamic = 'force-dynamic'

export default async function NotificationSettingsPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get or create notification preferences
  let { data: preferences } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If no preferences exist, create default ones
  if (!preferences) {
    const { data: newPreferences, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification preferences:', error)
    } else {
      preferences = newPreferences
    }
  }

  return <NotificationSettingsContent preferences={preferences} />
}
