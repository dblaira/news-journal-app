import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { connectionId, action, snoozeDurationHours } = body

  if (!connectionId || !action) {
    return NextResponse.json({ error: 'connectionId and action required' }, { status: 400 })
  }

  const validActions = ['landed', 'snooze', 'opened']
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

  const { error } = await supabase
    .from('notification_responses')
    .insert({
      connection_id: connectionId,
      action,
    })

  if (error) {
    console.error('Notification response error:', error)
    return NextResponse.json({ error: 'Failed to record response' }, { status: 500 })
  }

  if (action === 'landed') {
    const { data: entry } = await supabase
      .from('entries')
      .select('landed_count')
      .eq('id', connectionId)
      .single()

    await supabase
      .from('entries')
      .update({ landed_count: (entry?.landed_count || 0) + 1 })
      .eq('id', connectionId)
  }

  if (action === 'snooze') {
    const { data: entry } = await supabase
      .from('entries')
      .select('snooze_count')
      .eq('id', connectionId)
      .single()

    const snoozeHours = snoozeDurationHours || 48
    const snoozedUntil = new Date(Date.now() + snoozeHours * 60 * 60 * 1000).toISOString()

    await supabase
      .from('entries')
      .update({
        snooze_count: (entry?.snooze_count || 0) + 1,
        snoozed_until: snoozedUntil,
        last_surfaced_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
  }

  return NextResponse.json({ success: true })
}
