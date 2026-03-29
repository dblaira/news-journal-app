'use client'

import { supabase as _supabaseInstance } from '@/lib/supabase/client'
const createClient = () => _supabaseInstance

export type ErrorLevel = 'error' | 'warn' | 'info'

export interface AppError {
  id?: string
  level: ErrorLevel
  source: string
  message: string
  context?: Record<string, unknown>
  created_at?: string
  resolved?: boolean
}

type Listener = () => void

let listeners: Listener[] = []
let unreadCount = 0

function notify() {
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

export function getUnreadCount() {
  return unreadCount
}

export function incrementUnread() {
  unreadCount++
  notify()
}

export function clearUnread() {
  unreadCount = 0
  notify()
}

async function writeToSupabase(
  level: ErrorLevel,
  source: string,
  message: string,
  context?: Record<string, unknown>
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('app_errors').insert({
      user_id: user.id,
      level,
      source,
      message,
      context: context || {},
    })
  } catch {
    // Last resort — don't let the logger itself crash the app
    console.error('[debug-logger] Failed to write error to Supabase')
  }
}

export function logError(
  source: string,
  message: string,
  context?: Record<string, unknown>
) {
  incrementUnread()
  writeToSupabase('error', source, message, context)
}

export function logWarn(
  source: string,
  message: string,
  context?: Record<string, unknown>
) {
  incrementUnread()
  writeToSupabase('warn', source, message, context)
}

export function logInfo(
  source: string,
  message: string,
  context?: Record<string, unknown>
) {
  writeToSupabase('info', source, message, context)
}

export async function getRecentErrors(limit = 30): Promise<AppError[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('app_errors')
      .select('id, level, source, message, context, created_at, resolved')
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data as AppError[]) || []
  } catch {
    return []
  }
}

export async function markAllResolved() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('app_errors')
      .update({ resolved: true })
      .eq('user_id', user.id)
      .eq('resolved', false)

    clearUnread()
  } catch {
    // Silently fail
  }
}

export async function getUnresolvedCount(): Promise<number> {
  try {
    const supabase = createClient()
    const { count } = await supabase
      .from('app_errors')
      .select('id', { count: 'exact', head: true })
      .eq('resolved', false)

    return count || 0
  } catch {
    return 0
  }
}

/* ───────────────────────── FEEDBACK ───────────────────────── */

export type FeedbackCategory = 'bug' | 'design' | 'feature' | 'observation'

export interface AppFeedback {
  id?: string
  category: FeedbackCategory
  body: string
  page?: string
  created_at?: string
  resolved?: boolean
}

export async function saveFeedback(
  category: FeedbackCategory,
  body: string,
  page?: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from('app_feedback').insert({
      user_id: user.id,
      category,
      body,
      page: page || null,
    })

    return !error
  } catch {
    return false
  }
}

export async function getRecentFeedback(limit = 50): Promise<AppFeedback[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('app_feedback')
      .select('id, category, body, page, created_at, resolved')
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data as AppFeedback[]) || []
  } catch {
    return []
  }
}

export async function resolveFeedback(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('app_feedback')
      .update({ resolved: true })
      .eq('id', id)

    return !error
  } catch {
    return false
  }
}

export async function deleteFeedback(id: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('app_feedback')
      .delete()
      .eq('id', id)

    return !error
  } catch {
    return false
  }
}
