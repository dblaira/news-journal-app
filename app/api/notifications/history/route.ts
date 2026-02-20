import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: responses, error } = await supabase
      .from('notification_responses')
      .select(`
        id,
        action,
        surfaced_at,
        responded_at,
        connection_id,
        entries!notification_responses_connection_id_fkey (
          id,
          content,
          connection_type,
          headline
        )
      `)
      .eq('user_id', user.id)
      .order('responded_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Notification history error:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    const history = (responses || []).map(r => {
      const entry = r.entries as unknown as { id: string, content: string, connection_type: string, headline: string } | null
      return {
        id: r.id,
        action: r.action,
        surfaced_at: r.surfaced_at,
        responded_at: r.responded_at,
        connection_id: r.connection_id,
        connection_content: entry?.content?.replace(/<[^>]*>/g, '').trim().slice(0, 100) || '',
        connection_type: entry?.connection_type || '',
        connection_headline: entry?.headline || '',
      }
    })

    return NextResponse.json({ history })
  } catch (err) {
    console.error('History route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
