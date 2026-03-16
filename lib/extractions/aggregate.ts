import { ExtractionWithEntryDate, MapNode } from '@/types/extraction'
import { computeImportanceScores, RawNodeData, ImportanceWeights } from './importance'

export const CATEGORY_COLORS: Record<string, string> = {
  affect: '#8B5CF6',
  ambition: '#3B82F6',
  belief: '#7C3AED',
  exercise: '#10B981',
  health: '#F43F5E',
  insight: '#F59E0B',
  nutrition: '#14B8A6',
  purchase: '#EC4899',
  sleep: '#6366F1',
  social: '#F97316',
  work: '#0EA5E9',
  entertainment: '#D946EF',
  learning: '#06B6D4',
}

const FALLBACK_COLORS = [
  '#64748B', '#A855F7', '#06B6D4', '#84CC16',
  '#E11D48', '#0D9488', '#D946EF', '#EA580C',
]

function getCategoryColor(category: string): string {
  const lower = category.toLowerCase()
  if (CATEGORY_COLORS[lower]) return CATEGORY_COLORS[lower]
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
  const idx = Math.abs(hashCode(lower)) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[idx]
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

interface CategoryAccumulator {
  extractions: ExtractionWithEntryDate[]
  totalConfidence: number
  totalIntensity: number
  intensityCount: number
  mostRecentEntryDate: string
}

interface ConceptAccumulator {
  key: string
  value: string
  category: string
  count: number
  totalConfidence: number
  totalIntensity: number
  intensityCount: number
  mostRecentEntryDate: string
}

function extractIntensity(data: Record<string, string | number | boolean>): number | null {
  if (typeof data.intensity === 'number') return data.intensity
  if (typeof data.level === 'number') return data.level
  if (typeof data.severity === 'number') return data.severity
  return null
}

export function aggregateExtractions(
  extractions: ExtractionWithEntryDate[],
  weights?: Partial<ImportanceWeights>
): MapNode[] {
  if (extractions.length === 0) return []

  const categoryMap = new Map<string, CategoryAccumulator>()
  const conceptMap = new Map<string, ConceptAccumulator>()

  for (const ext of extractions) {
    const cat = ext.category
    const entryDate = ext.entries?.created_at || ext.created_at

    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        extractions: [],
        totalConfidence: 0,
        totalIntensity: 0,
        intensityCount: 0,
        mostRecentEntryDate: entryDate,
      })
    }
    const acc = categoryMap.get(cat)!
    acc.extractions.push(ext)
    acc.totalConfidence += ext.confidence

    const intensity = extractIntensity(ext.data)
    if (intensity !== null) {
      acc.totalIntensity += intensity
      acc.intensityCount++
    }

    if (new Date(entryDate) > new Date(acc.mostRecentEntryDate)) {
      acc.mostRecentEntryDate = entryDate
    }

    for (const [key, value] of Object.entries(ext.data)) {
      if (typeof value !== 'string') continue
      if (value.length > 50) continue

      const conceptId = `${cat}::${key}::${value.toLowerCase()}`
      if (!conceptMap.has(conceptId)) {
        conceptMap.set(conceptId, {
          key,
          value: value.toLowerCase(),
          category: cat,
          count: 0,
          totalConfidence: 0,
          totalIntensity: 0,
          intensityCount: 0,
          mostRecentEntryDate: entryDate,
        })
      }
      const cAcc = conceptMap.get(conceptId)!
      cAcc.count++
      cAcc.totalConfidence += ext.confidence

      if (intensity !== null) {
        cAcc.totalIntensity += intensity
        cAcc.intensityCount++
      }

      if (new Date(entryDate) > new Date(cAcc.mostRecentEntryDate)) {
        cAcc.mostRecentEntryDate = entryDate
      }
    }
  }

  const categoryRawNodes: RawNodeData[] = []
  const categoryEntries: [string, CategoryAccumulator][] = Array.from(categoryMap.entries())

  for (const [, acc] of categoryEntries) {
    categoryRawNodes.push({
      occurrences: acc.extractions.length,
      avgIntensity: acc.intensityCount > 0
        ? acc.totalIntensity / acc.intensityCount
        : 0.5,
      avgConfidence: acc.totalConfidence / acc.extractions.length,
      mostRecentEntryDate: acc.mostRecentEntryDate,
    })
  }

  const recurringConcepts = Array.from(conceptMap.entries())
    .filter(([, c]) => c.count >= 2)

  const conceptRawNodes: RawNodeData[] = recurringConcepts.map(([, c]) => ({
    occurrences: c.count,
    avgIntensity: c.intensityCount > 0
      ? c.totalIntensity / c.intensityCount
      : 0.5,
    avgConfidence: c.totalConfidence / c.count,
    mostRecentEntryDate: c.mostRecentEntryDate,
  }))

  const allRawNodes = [...categoryRawNodes, ...conceptRawNodes]
  const scores = computeImportanceScores(allRawNodes, weights)

  const nodes: MapNode[] = []

  categoryEntries.forEach(([cat, acc], i) => {
    nodes.push({
      id: `cat::${cat}`,
      label: cat,
      category: cat,
      type: 'category',
      importance: scores[i],
      confidence: acc.totalConfidence / acc.extractions.length,
      occurrences: acc.extractions.length,
      color: getCategoryColor(cat),
    })
  })

  recurringConcepts.forEach(([, c], i) => {
    const scoreIdx = categoryEntries.length + i
    nodes.push({
      id: `concept::${c.category}::${c.key}::${c.value}`,
      label: c.value,
      category: c.category,
      type: 'concept',
      parentId: `cat::${c.category}`,
      importance: scores[scoreIdx],
      confidence: c.totalConfidence / c.count,
      occurrences: c.count,
      color: getCategoryColor(c.category),
    })
  })

  return nodes
}

export function aggregateByOntology(
  extractions: ExtractionWithEntryDate[],
  weights?: Partial<ImportanceWeights>
): MapNode[] {
  if (extractions.length === 0) return []

  const parentMap = new Map<string, CategoryAccumulator>()

  for (const ext of extractions) {
    const parent = ext.parent_category || ext.category
    const entryDate = ext.entries?.created_at || ext.created_at

    if (!parentMap.has(parent)) {
      parentMap.set(parent, {
        extractions: [],
        totalConfidence: 0,
        totalIntensity: 0,
        intensityCount: 0,
        mostRecentEntryDate: entryDate,
      })
    }
    const acc = parentMap.get(parent)!
    acc.extractions.push(ext)
    acc.totalConfidence += ext.confidence

    const intensity = extractIntensity(ext.data)
    if (intensity !== null) {
      acc.totalIntensity += intensity
      acc.intensityCount++
    }

    if (new Date(entryDate) > new Date(acc.mostRecentEntryDate)) {
      acc.mostRecentEntryDate = entryDate
    }
  }

  const parentEntries = Array.from(parentMap.entries())

  const rawNodes: RawNodeData[] = parentEntries.map(([, acc]) => ({
    occurrences: acc.extractions.length,
    avgIntensity: acc.intensityCount > 0
      ? acc.totalIntensity / acc.intensityCount
      : 0.5,
    avgConfidence: acc.totalConfidence / acc.extractions.length,
    mostRecentEntryDate: acc.mostRecentEntryDate,
  }))

  const scores = computeImportanceScores(rawNodes, weights)

  return parentEntries.map(([parent, acc], i) => ({
    id: `parent::${parent}`,
    label: parent,
    category: parent,
    type: 'category' as const,
    nodeLevel: 'parent' as const,
    importance: scores[i],
    confidence: acc.totalConfidence / acc.extractions.length,
    occurrences: acc.extractions.length,
    color: getCategoryColor(parent),
  }))
}
