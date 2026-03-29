import { createAdminClient } from '@/lib/supabase/admin'

export type ErrorLevel = 'error' | 'warn' | 'info'

export async function logServerError(
  source: string,
  message: string,
  context?: Record<string, unknown>,
  userId?: string
) {
  try {
    const supabase = createAdminClient()
    await supabase.from('app_errors').insert({
      user_id: userId || null,
      level: 'error' as ErrorLevel,
      source,
      message,
      context: context || {},
    })
  } catch {
    console.error(`[server-logger] Failed to log: ${source} — ${message}`)
  }
}

export async function logServerWarn(
  source: string,
  message: string,
  context?: Record<string, unknown>,
  userId?: string
) {
  try {
    const supabase = createAdminClient()
    await supabase.from('app_errors').insert({
      user_id: userId || null,
      level: 'warn' as ErrorLevel,
      source,
      message,
      context: context || {},
    })
  } catch {
    console.error(`[server-logger] Failed to log: ${source} — ${message}`)
  }
}
