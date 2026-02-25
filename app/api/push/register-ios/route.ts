import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { device_token, device_name, timezone } = body

  if (!device_token) {
    return NextResponse.json({ error: 'device_token required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ios_push_tokens')
    .upsert(
      {
        user_id: user.id,
        device_token,
        device_name: device_name || null,
        timezone: timezone || 'America/Los_Angeles',
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_token' }
    )
    .select()
    .single()

  if (error) {
    console.error('iOS push register error:', error)
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 })
  }

  return NextResponse.json({ token: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { device_token } = body

  if (!device_token) {
    return NextResponse.json({ error: 'device_token required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('ios_push_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('device_token', device_token)

  if (error) {
    console.error('iOS push unregister error:', error)
    return NextResponse.json({ error: 'Failed to unregister token' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
