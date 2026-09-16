import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/queries'
import { QuestionHistoryPage } from './question-history-page'

export default async function ConnectHistoryPage() {
  const supabase = await createClient()

  // Both already resolved by the (app) layout.
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const userData = await getCurrentProfile()

  if (!userData?.family_id) {
    redirect('/onboarding')
  }

  // Get past questions (exclude current week)
  const { data: pastQuestions } = await supabase
    .from('weekly_questions')
    .select(`
      id,
      question_text,
      week_start_date,
      week_number,
      status,
      users!weekly_questions_assigned_user_id_fkey(id, name, avatar_url)
    `)
    .eq('family_id', userData.family_id)
    .eq('status', 'active') // Only show completed questions
    .order('week_number', { ascending: false })
    .limit(20)

  return (
    <QuestionHistoryPage
      currentUserId={user.id}
      pastQuestions={pastQuestions || []}
    />
  )
}
