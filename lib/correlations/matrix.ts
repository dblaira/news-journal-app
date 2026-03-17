import { Extraction } from '@/types/extraction'
import { WeekRow, DomainBreakdown, WeeklyMatrix } from '@/types/correlation'

function getISOWeekKey(dateStr: string): { weekKey: string; year: number; week: number } {
  const d = new Date(dateStr)
  d.setUTCHours(0, 0, 0, 0)

  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

  const year = d.getUTCFullYear()
  const paddedWeek = String(weekNum).padStart(2, '0')
  return { weekKey: `${year}-W${paddedWeek}`, year, week: weekNum }
}

function getExtractionDate(ext: Extraction): string | null {
  if (ext.time_window_start) return ext.time_window_start
  if (ext.created_at) return ext.created_at.split('T')[0]
  return null
}

export function buildWeeklyMatrix(
  extractions: Extraction[],
  dateFrom?: string,
  dateTo?: string
): WeeklyMatrix {
  const filtered = extractions.filter(ext => {
    if (!ext.parent_category) return false
    const d = getExtractionDate(ext)
    if (!d) return false
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    return true
  })

  const weekMap = new Map<string, { year: number; week: number; counts: Record<string, number>; total: number }>()
  const categorySet = new Set<string>()
  const domainBreakdown: DomainBreakdown = {}

  for (const ext of filtered) {
    const d = getExtractionDate(ext)!
    const { weekKey, year, week } = getISOWeekKey(d)
    const cat = ext.parent_category!
    const domain = ext.source_domain || 'journal'

    categorySet.add(cat)

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { year, week, counts: {}, total: 0 })
    }
    const row = weekMap.get(weekKey)!
    row.counts[cat] = (row.counts[cat] || 0) + 1
    row.total += 1

    if (!domainBreakdown[weekKey]) domainBreakdown[weekKey] = {}
    if (!domainBreakdown[weekKey][cat]) domainBreakdown[weekKey][cat] = {}
    domainBreakdown[weekKey][cat][domain] = (domainBreakdown[weekKey][cat][domain] || 0) + 1
  }

  const categories = Array.from(categorySet).sort()

  const weeks: WeekRow[] = Array.from(weekMap.entries())
    .map(([weekKey, data]) => ({
      weekKey,
      year: data.year,
      week: data.week,
      counts: data.counts,
      total: data.total,
    }))
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))

  // Fill in zeros for categories that have no data in a given week
  for (const row of weeks) {
    for (const cat of categories) {
      if (!(cat in row.counts)) row.counts[cat] = 0
    }
  }

  const dates = filtered.map(ext => getExtractionDate(ext)!).sort()

  return {
    weeks,
    categories,
    domainBreakdown,
    dateRange: {
      start: dateFrom || dates[0] || '',
      end: dateTo || dates[dates.length - 1] || '',
    },
    totalExtractions: filtered.length,
  }
}
