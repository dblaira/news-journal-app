export interface ImportanceWeights {
  occurrences: number
  intensity: number
  confidence: number
  recency: number
}

export const DEFAULT_WEIGHTS: ImportanceWeights = {
  occurrences: 0.3,
  intensity: 0.3,
  confidence: 0.2,
  recency: 0.2,
}

export interface RawNodeData {
  occurrences: number
  avgIntensity: number
  avgConfidence: number
  mostRecentEntryDate: string
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

export function computeImportanceScores(
  nodes: RawNodeData[],
  weights: Partial<ImportanceWeights> = {}
): number[] {
  const w = { ...DEFAULT_WEIGHTS, ...weights }

  if (nodes.length === 0) return []

  const occValues = nodes.map(n => Math.log(n.occurrences + 1))
  const occMin = Math.min(...occValues)
  const occMax = Math.max(...occValues)

  const intValues = nodes.map(n => n.avgIntensity)
  const intMin = Math.min(...intValues)
  const intMax = Math.max(...intValues)

  const now = Date.now()
  const timestamps = nodes.map(n => new Date(n.mostRecentEntryDate).getTime())
  const oldest = Math.min(...timestamps)
  const newest = Math.max(...timestamps)

  return nodes.map((node, i) => {
    const normOcc = normalize(Math.log(node.occurrences + 1), occMin, occMax)
    const normInt = normalize(node.avgIntensity, intMin, intMax)
    const normConf = node.avgConfidence
    const normRecency = normalize(timestamps[i], oldest, newest)

    return (
      normOcc * w.occurrences +
      normInt * w.intensity +
      normConf * w.confidence +
      normRecency * w.recency
    )
  })
}
