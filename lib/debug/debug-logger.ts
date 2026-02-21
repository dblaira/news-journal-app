// ============================================================
// Debug Kit — Logger
// ============================================================
// Supabase import (line 11): update this if your project uses
// a different path or a factory function. The logger expects a
// Supabase client with .from() and .auth.getUser() available.
// ============================================================

'use client'

import { supabase } from '@/lib/supabase/client'
import { DEBUG_ENABLED, MAX_LOG_ROWS } from './debug-config'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  page: string
  message: string
  metadata?: Record<string, unknown>
}

let sessionId: string | null = null

function getSessionId(): string {
  if (sessionId) return sessionId
  sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return sessionId
}

const LOG_QUEUE: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL_MS = 2000
const FLUSH_BATCH_SIZE = 20

async function flushQueue() {
  if (LOG_QUEUE.length === 0) return

  const batch = LOG_QUEUE.splice(0, FLUSH_BATCH_SIZE)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Not authenticated — keep logs in console only
      return
    }

    const rows = batch.map(entry => ({
      user_id: user.id,
      level: entry.level,
      page: entry.page,
      message: entry.message,
      metadata: entry.metadata ?? {},
      session_id: getSessionId(),
    }))

    const { error } = await supabase.from('debug_logs').insert(rows)

    if (error) {
      console.error('[debug-logger] Failed to flush logs:', error.message)
    }

    if (MAX_LOG_ROWS > 0) {
      pruneOldRows(user.id).catch(() => {})
    }
  } catch (err) {
    console.error('[debug-logger] Flush error:', err)
  }
}

async function pruneOldRows(userId: string) {
  const { count } = await supabase
    .from('debug_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count && count > MAX_LOG_ROWS) {
    const excess = count - MAX_LOG_ROWS
    const { data: oldest } = await supabase
      .from('debug_logs')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(excess)

    if (oldest && oldest.length > 0) {
      await supabase
        .from('debug_logs')
        .delete()
        .in('id', oldest.map(r => r.id))
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushQueue()
  }, FLUSH_INTERVAL_MS)
}

function log(level: LogLevel, page: string, message: string, metadata?: Record<string, unknown>) {
  if (!DEBUG_ENABLED) return

  const prefix = `[debug:${level}]`
  const consoleMethod = level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : console.log
  consoleMethod(prefix, `(${page})`, message, metadata ?? '')

  LOG_QUEUE.push({ level, page, message, metadata })
  scheduleFlush()
}

export const debugLog = {
  info:  (page: string, message: string, metadata?: Record<string, unknown>) => log('info', page, message, metadata),
  warn:  (page: string, message: string, metadata?: Record<string, unknown>) => log('warn', page, message, metadata),
  error: (page: string, message: string, metadata?: Record<string, unknown>) => log('error', page, message, metadata),
  debug: (page: string, message: string, metadata?: Record<string, unknown>) => log('debug', page, message, metadata),
  flush: flushQueue,
}

export type { LogLevel, LogEntry }
