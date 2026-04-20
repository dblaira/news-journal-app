import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      preferences: prefs || {
        morning_time: '07:00',
        midday_time: '12:00',
        evening_time: '18:00',
        timezone: 'America/Los_Angeles',
      },
    })
  } catch (err) {
    console.error('Get preferences error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { morning_time, midday_time, evening_time, timezone } = body

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .upsert(
        {
          user_id: user.id,
          morning_time: morning_time || '07:00',
          midday_time: midday_time || '12:00',
          evening_time: evening_time || '18:00',
          timezone: timezone || 'America/Los_Angeles',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Update preferences error:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (err) {
    console.error('Preferences route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
