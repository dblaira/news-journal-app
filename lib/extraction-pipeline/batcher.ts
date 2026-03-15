import { NormalizedRecord, TimeWindowBatch, WindowSize } from './types'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getSunday(monday: Date): Date {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function windowKey(date: Date, windowSize: WindowSize): string {
  if (windowSize === 'week') {
    const monday = getMonday(date)
    return monday.toISOString().slice(0, 10)
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function windowBounds(key: string, windowSize: WindowSize): { start: Date; end: Date } {
  if (windowSize === 'week') {
    const monday = new Date(key + 'T00:00:00Z')
    return { start: monday, end: getSunday(monday) }
  }
  const [year, month] = key.split('-').map(Number)
  const start = getMonthStart(new Date(year, month - 1, 1))
  const end = getMonthEnd(new Date(year, month - 1, 1))
  return { start, end }
}

export function batchByTimeWindow(
  records: NormalizedRecord[],
  windowSize: WindowSize
): TimeWindowBatch[] {
  if (records.length === 0) return []

  const groups = new Map<string, NormalizedRecord[]>()

  for (const record of records) {
    const date = new Date(record.timestamp)
    const key = windowKey(date, windowSize)

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(record)
  }

  const sortedKeys = Array.from(groups.keys()).sort()
  const sourceDomain = records[0].source_domain

  return sortedKeys.map(key => {
    const bounds = windowBounds(key, windowSize)
    return {
      window_start: bounds.start.toISOString().slice(0, 10),
      window_end: bounds.end.toISOString().slice(0, 10),
      source_domain: sourceDomain,
      records: groups.get(key)!,
    }
  })
}

export function formatWindowLabel(batch: TimeWindowBatch, windowSize: WindowSize): string {
  if (windowSize === 'month') {
    const date = new Date(batch.window_start + 'T00:00:00Z')
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }
  const start = new Date(batch.window_start + 'T00:00:00Z')
  const end = new Date(batch.window_end + 'T00:00:00Z')
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return `${startStr} – ${endStr}`
}
