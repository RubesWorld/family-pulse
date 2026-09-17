import { getCurrentProfile } from '@/lib/supabase/queries'
import { SettingsContent } from './settings-content'

export default async function SettingsPage() {
  // Already resolved by the (app) layout, so this is free.
  const profile = await getCurrentProfile()
  const family = profile?.families as
    | { name: string; invite_code: string }
    | null

  return (
    <SettingsContent
      familyName={family?.name || 'Family'}
      inviteCode={family?.invite_code || ''}
    />
  )
}
