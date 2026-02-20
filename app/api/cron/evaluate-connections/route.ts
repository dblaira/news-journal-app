import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const CONNECTION_TYPE_LABELS: Record<string, string> = {
  identity_anchor: 'Identity Anchor',
  pattern_interrupt: 'Pattern Interrupt',
  validated_principle: 'Validated Principle',
  process_anchor: 'Process Anchor',
}

const PRIORITY_WEIGHTS: Record<string, number> = {
  high: 3,
  normal: 2,
  low: 1,
}

type TimeWindow = 'morning' | 'midday' | 'evening'

interface WindowConfig {
  defaultHour: number
  rangeHours: number
}

const DEFAULT_WINDOWS: Record<TimeWindow, WindowConfig> = {
  morning: { defaultHour: 7, rangeHours: 2 },
  midday: { defaultHour: 12, rangeHours: 1 },
  evening: { defaultHour: 18, rangeHours: 2 },
}

function getCurrentTimeWindow(
  nowUtcHour: number,
  prefs?: { morning_time?: string, midday_time?: string, evening_time?: string, timezone?: string }
): TimeWindow | null {
  const tz = prefs?.timezone || 'America/Los_Angeles'

  const now = new Date()
  const localTimeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false })
  const localHour = parseInt(localTimeStr.split(':')[0], 10)

  const morningHour = prefs?.morning_time ? parseInt(prefs.morning_time.split(':')[0], 10) : 7
  const middayHour = prefs?.midday_time ? parseInt(prefs.midday_time.split(':')[0], 10) : 12
  const eveningHour = prefs?.evening_time ? parseInt(prefs.evening_time.split(':')[0], 10) : 18

  if (localHour >= morningHour && localHour < morningHour + 2) return 'morning'
  if (localHour >= middayHour && localHour < middayHour + 1) return 'midday'
  if (localHour >= eveningHour && localHour < eveningHour + 2) return 'evening'

  return null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function scoreConnection(entry: {
  priority?: string
  last_surfaced_at?: string | null
  surface_count?: number
  landed_count?: number
  snooze_count?: number
}): number {
  const priorityWeight = PRIORITY_WEIGHTS[entry.priority || 'normal'] || 2

  let stalenessBonus = 0
  if (entry.last_surfaced_at) {
    const hoursSinceSurfaced = (Date.now() - new Date(entry.last_surfaced_at).getTime()) / (1000 * 60 * 60)
    stalenessBonus = Math.min(hoursSinceSurfaced / 168, 2)
  } else {
    stalenessBonus = 2
  }

  let responseRatio = 0
  const totalResponses = (entry.landed_count || 0) + (entry.snooze_count || 0)
  if (totalResponses > 0) {
    responseRatio = ((entry.landed_count || 0) / totalResponses) * 2 - 1
  }

  const randomFactor = Math.random() * 0.5

  return priorityWeight + stalenessBonus + responseRatio + randomFactor
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!supabaseUrl || !serviceRoleKey || !vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: 'Missing environment configuration' }, { status: 500 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    webpush.setVapidDetails('mailto:admin@understood.app', vapidPublic, vapidPrivate)

    const { data: allSubscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (!allSubscriptions?.length) {
      return NextResponse.json({ message: 'No subscriptions found', sent: 0 })
    }

    const userIds = [...new Set(allSubscriptions.map(s => s.user_id))]
    const results: { userId: string, connectionId?: string, sent: boolean, reason?: string }[] = []

    for (const userId of userIds) {
      const userSubs = allSubscriptions.filter(s => s.user_id === userId)

      const { data: prefs } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      const currentWindow = getCurrentTimeWindow(new Date().getUTCHours(), prefs)

      if (!currentWindow) {
        results.push({ userId, sent: false, reason: 'outside_time_window' })
        continue
      }

      const now = new Date()
      const dayOfWeek = parseInt(
        now.toLocaleDateString('en-US', {
          timeZone: prefs?.timezone || 'America/Los_Angeles',
          weekday: 'narrow',
        }),
        10
      )
      const localDate = new Date(now.toLocaleString('en-US', { timeZone: prefs?.timezone || 'America/Los_Angeles' }))
      const currentDay = localDate.getDay()

      const { data: connections } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_type', 'connection')

      if (!connections?.length) {
        results.push({ userId, sent: false, reason: 'no_connections' })
        continue
      }

      const eligible = connections.filter(conn => {
        const conditions = conn.surface_conditions || {}
        const timeWindows: string[] = conditions.time_windows || ['morning', 'midday', 'evening']
        if (!timeWindows.includes(currentWindow)) return false

        const daysOfWeek: number[] = conditions.days_of_week || [0, 1, 2, 3, 4, 5, 6]
        if (!daysOfWeek.includes(currentDay)) return false

        const minInterval = conditions.min_interval_hours || 48
        if (conn.last_surfaced_at) {
          const hoursSince = (Date.now() - new Date(conn.last_surfaced_at).getTime()) / (1000 * 60 * 60)
          if (hoursSince < minInterval) return false
        }

        if (conn.snoozed_until && new Date(conn.snoozed_until) > now) return false

        return true
      })

      if (!eligible.length) {
        results.push({ userId, sent: false, reason: 'no_eligible_connections' })
        continue
      }

      const scored = eligible.map(conn => ({
        conn,
        score: scoreConnection({
          priority: conn.surface_conditions?.priority,
          last_surfaced_at: conn.last_surfaced_at,
          surface_count: conn.surface_count,
          landed_count: conn.landed_count,
          snooze_count: conn.snooze_count,
        }),
      }))

      scored.sort((a, b) => b.score - a.score)
      const winner = scored[0].conn

      const contentText = stripHtml(winner.content || '')
      const typeLabel = CONNECTION_TYPE_LABELS[winner.connection_type || ''] || 'Connection'

      const payload = JSON.stringify({
        title: typeLabel,
        body: contentText.length > 200 ? contentText.slice(0, 197) + '...' : contentText,
        connectionId: winner.id,
        url: `/?connection=${winner.id}&from=notification`,
      })

      const sendResults = await Promise.allSettled(
        userSubs.map(sub =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            },
            payload
          )
        )
      )

      const sentCount = sendResults.filter(r => r.status === 'fulfilled').length
      const failedSubs = sendResults
        .map((r, i) => r.status === 'rejected' ? userSubs[i] : null)
        .filter(Boolean)

      for (const failedSub of failedSubs) {
        if (failedSub) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', failedSub.id)
        }
      }

      await supabase
        .from('entries')
        .update({
          last_surfaced_at: now.toISOString(),
          surface_count: (winner.surface_count || 0) + 1,
        })
        .eq('id', winner.id)

      results.push({ userId, connectionId: winner.id, sent: sentCount > 0 })
    }

    return NextResponse.json({
      evaluated: results.length,
      sent: results.filter(r => r.sent).length,
      skipped: results.filter(r => !r.sent).length,
      details: results,
    })
  } catch (err) {
    console.error('Evaluate connections error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
