import { createClient } from '@/lib/supabase/server'
import { FamilyContent } from './family-content'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get family profile
  const { data: profile } = await supabase
    .from('users')
    .select('family_id, families(name)')
    .eq('id', user?.id || '')
    .single()

  // Get all family members
  const { data: members } = await supabase
    .from('users')
    .select('*')
    .eq('family_id', profile?.family_id || '')
    .order('name')

  // Get recent picks (last 10, only current picks)
  const { data: recentPicks } = await supabase
    .from('picks')
    .select('*, users(name, avatar_url)')
    .in('user_id', members?.map(m => m.id) || [])
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <FamilyContent
      familyName={(profile?.families as { name: string } | null)?.name || 'Family'}
      members={members || []}
      recentPicks={recentPicks || []}
    />
  )
}
