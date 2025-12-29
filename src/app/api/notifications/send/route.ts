import { NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/send-push'

export async function POST(request: Request) {
  try {
    // Verify this is an internal request (you might want to add a secret token)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.INTERNAL_API_SECRET

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, notificationType, title, bodyText, url, questionId, activityId } = body

    if (!userId || !notificationType || !title || !bodyText) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, notificationType, title, bodyText' },
        { status: 400 }
      )
    }

    const result = await sendPushNotification({
      userId,
      notificationType,
      title,
      body: bodyText,
      url,
      questionId,
      activityId,
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in send notification endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
