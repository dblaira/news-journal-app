import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { connectionId, action } = await request.json()

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

  if (action === 'snooze') {
    await supabase
      .from('entries')
      .update({ last_surfaced_at: new Date().toISOString() })
      .eq('id', connectionId)
  }

  return NextResponse.json({ success: true })
}
