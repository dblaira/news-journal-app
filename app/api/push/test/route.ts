import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (!vapidPublic || !vapidPrivate) {
      const missing = [
        !vapidPublic && 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
        !vapidPrivate && 'VAPID_PRIVATE_KEY',
      ].filter(Boolean)
      return NextResponse.json({
        error: `Missing environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Add ${missing.length > 1 ? 'them' : 'it'} in Vercel → Settings → Environment Variables for Production and Preview.`,
      }, { status: 500 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    webpush.setVapidDetails(
      'mailto:admin@understood.app',
      vapidPublic,
      vapidPrivate
    )

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(10)

    if (subError || !subscriptions?.length) {
      return NextResponse.json(
        { error: 'No push subscriptions found. Enable notifications first.', detail: subError?.message },
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
