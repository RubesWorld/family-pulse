import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekNumber, getCurrentWeekStart } from '@/lib/connect-utils'

export async function POST() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's family
  const { data: userData } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single()

  if (!userData?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 400 })
  }

  const currentWeekNumber = getCurrentWeekNumber()
  const weekStartDate = getCurrentWeekStart()

  try {
    // Check if question already exists for this week
    const { data: existingQuestion } = await supabase
      .from('weekly_questions')
      .select('id')
      .eq('family_id', userData.family_id)
      .eq('week_number', currentWeekNumber)
      .single()

    if (existingQuestion) {
      return NextResponse.json({
        message: 'Question already exists for this week',
        question_id: existingQuestion.id
      })
    }

    // Get family members (sorted alphabetically by ID for consistency)
    const { data: members } = await supabase
      .from('users')
      .select('id, name')
      .eq('family_id', userData.family_id)
      .order('id')

    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'No family members found' }, { status: 400 })
    }

    // First member alphabetically by ID
    const firstMember = members[0]

    // Get a random preset question
    const { data: presetQuestions } = await supabase
      .from('preset_questions')
      .select('question_text')

    if (!presetQuestions || presetQuestions.length === 0) {
      return NextResponse.json({ error: 'No preset questions available' }, { status: 500 })
    }

    const randomQuestion = presetQuestions[Math.floor(Math.random() * presetQuestions.length)]

    // Create first pending question for this family
    const { data: newQuestion, error: insertError } = await supabase
      .from('weekly_questions')
      .insert({
        family_id: userData.family_id,
        question_text: '', // Will be set when assigned person chooses
        suggested_question_text: randomQuestion.question_text,
        week_start_date: weekStartDate.toISOString().split('T')[0],
        week_number: currentWeekNumber,
        assigned_user_id: firstMember.id,
        is_preset: true,
        is_current: true,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: 'First question created (pending)',
      question: newQuestion,
    })
  } catch (error) {
    console.error('Error initializing Connect:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Connect', details: error },
      { status: 500 }
    )
  }
}
