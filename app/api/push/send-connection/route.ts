import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const CONNECTION_TYPE_LABELS: Record<string, string> = {
  identity_anchor: 'Identity Anchor',
  pattern_interrupt: 'Pattern Interrupt',
  validated_principle: 'Validated Principle',
  process_anchor: 'Process Anchor',
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export async function POST(request: NextRequest) {
  try {
    const { connectionId } = await request.json()

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!supabaseUrl || !serviceRoleKey || !vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: 'Missing environment configuration' }, { status: 500 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    webpush.setVapidDetails('mailto:admin@understood.app', vapidPublic, vapidPrivate)

    const { data: connection, error: connError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', connectionId)
      .eq('entry_type', 'connection')
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', connection.user_id)

    if (!subscriptions?.length) {
      return NextResponse.json({ error: 'No push subscriptions. Enable notifications in Settings.' }, { status: 404 })
    }

    const contentText = stripHtml(connection.content || '')
    const typeLabel = CONNECTION_TYPE_LABELS[connection.connection_type || ''] || 'Connection'

    const payload = JSON.stringify({
      title: typeLabel,
      body: contentText.length > 200 ? contentText.slice(0, 197) + '...' : contentText,
      connectionId: connection.id,
      url: `/?connection=${connection.id}&from=notification`,
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length

    await supabase
      .from('entries')
      .update({
        last_surfaced_at: new Date().toISOString(),
        surface_count: (connection.surface_count || 0) + 1,
      })
      .eq('id', connection.id)

    return NextResponse.json({ sent, total: subscriptions.length })
  } catch (err) {
    console.error('Send connection error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
