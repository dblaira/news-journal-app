import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: devices, error } = await supabase
      .from('push_subscriptions')
      .select('id, device_name, timezone, created_at, last_used_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch devices error:', error)
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
    }

    return NextResponse.json({ devices: devices || [] })
  } catch (err) {
    console.error('Devices route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
