import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Push test auth error:', authError.message)
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
    }

    webpush.setVapidDetails(
      'mailto:admin@understood.app',
      vapidPublic,
      vapidPrivate
    )

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)

    if (subError || !subscriptions?.length) {
      return NextResponse.json(
        { error: 'No push subscriptions found. Enable notifications first.' },
        { status: 404 }
      )
    }

    const payload = JSON.stringify({
      title: 'Understood',
      body: '\u201CAm I building a system or doing a task?\u201D',
      connectionId: 'test',
      url: '/',
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth,
            },
          },
          payload
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ sent, failed, total: subscriptions.length })
  } catch (err) {
    console.error('Push test error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
