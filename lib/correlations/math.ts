import { WeeklyMatrix, CorrelationPair, AnomalyWeek, CategoryStats } from '@/types/correlation'

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 3) return 0

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }

  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (den === 0) return 0
  return num / den
}

export function laggedCorrelation(x: number[], y: number[], lag: number): number {
  if (lag === 0) return pearsonCorrelation(x, y)
  if (lag > 0) {
    // x leads y: compare x[0..n-lag] with y[lag..n]
    return pearsonCorrelation(x.slice(0, -lag), y.slice(lag))
  }
  // y leads x
  return pearsonCorrelation(x.slice(-lag), y.slice(0, lag))
}

export function computeAllCorrelations(matrix: WeeklyMatrix, minWeeks = 10): CorrelationPair[] {
  const { weeks, categories } = matrix
  const pairs: CorrelationPair[] = []

  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const catA = categories[i]
      const catB = categories[j]

      const seriesA = weeks.map(w => w.counts[catA] || 0)
      const seriesB = weeks.map(w => w.counts[catB] || 0)

      // Skip pairs where either category has very sparse data
      const nonZeroA = seriesA.filter(v => v > 0).length
      const nonZeroB = seriesB.filter(v => v > 0).length
      if (nonZeroA < minWeeks || nonZeroB < minWeeks) continue

      const coeff = pearsonCorrelation(seriesA, seriesB)
      const absCoeff = Math.abs(coeff)
      if (absCoeff < 0.15) continue

      pairs.push({
        categoryA: catA,
        categoryB: catB,
        coefficient: Math.round(coeff * 1000) / 1000,
        lag: 0,
        type: coeff >= 0.3 ? 'co-movement' : coeff <= -0.3 ? 'inverse' : 'co-movement',
      })
    }
  }

  pairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
  return pairs
}

export function computeLaggedCorrelations(matrix: WeeklyMatrix, maxLag = 2, minWeeks = 10): CorrelationPair[] {
  const { weeks, categories } = matrix
  const leaders: CorrelationPair[] = []

  for (let i = 0; i < categories.length; i++) {
    for (let j = 0; j < categories.length; j++) {
      if (i === j) continue

      const catA = categories[i]
      const catB = categories[j]

      const seriesA = weeks.map(w => w.counts[catA] || 0)
      const seriesB = weeks.map(w => w.counts[catB] || 0)

      const nonZeroA = seriesA.filter(v => v > 0).length
      const nonZeroB = seriesB.filter(v => v > 0).length
      if (nonZeroA < minWeeks || nonZeroB < minWeeks) continue

      // A leads B by 1 or 2 weeks
      let bestLag = 0
      let bestCoeff = 0

      for (let lag = 1; lag <= maxLag; lag++) {
        const coeff = laggedCorrelation(seriesA, seriesB, lag)
        if (Math.abs(coeff) > Math.abs(bestCoeff)) {
          bestCoeff = coeff
          bestLag = lag
        }
      }

      // Only include if lagged correlation is meaningfully stronger than same-week
      const sameWeekCoeff = pearsonCorrelation(seriesA, seriesB)
      if (Math.abs(bestCoeff) > 0.3 && Math.abs(bestCoeff) > Math.abs(sameWeekCoeff) + 0.1) {
        leaders.push({
          categoryA: catA,
          categoryB: catB,
          coefficient: Math.round(bestCoeff * 1000) / 1000,
          lag: bestLag,
          type: 'leading',
        })
      }
    }
  }

  leaders.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
  return leaders
}

export function computeCategoryStats(matrix: WeeklyMatrix): CategoryStats[] {
  const { weeks, categories } = matrix
  const totalWeeks = weeks.length

  return categories.map(cat => {
    const values = weeks.map(w => w.counts[cat] || 0)
    const nonZero = values.filter(v => v > 0).length
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / totalWeeks
    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / totalWeeks
    const stdDev = Math.sqrt(variance)

    return {
      category: cat,
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      weeksWithData: nonZero,
      totalCount: sum,
      coveragePercent: Math.round((nonZero / totalWeeks) * 100),
    }
  })
}

export function detectAnomalies(matrix: WeeklyMatrix, threshold = 1.5): AnomalyWeek[] {
  const stats = computeCategoryStats(matrix)
  const { weeks, domainBreakdown } = matrix
  const anomalies: AnomalyWeek[] = []

  for (const row of weeks) {
    const weekAnomalies: AnomalyWeek['anomalies'] = []

    for (const stat of stats) {
      if (stat.stdDev === 0) continue
      const value = row.counts[stat.category] || 0
      const zScore = (value - stat.mean) / stat.stdDev

      if (Math.abs(zScore) >= threshold) {
        weekAnomalies.push({
          category: stat.category,
          value,
          mean: stat.mean,
          stdDev: stat.stdDev,
          zScore: Math.round(zScore * 100) / 100,
          direction: zScore > 0 ? 'spike' : 'drop',
        })
      }
    }

    if (weekAnomalies.length > 0) {
      anomalies.push({
        weekKey: row.weekKey,
        anomalies: weekAnomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)),
        domainBreakdown: domainBreakdown[row.weekKey] || {},
      })
    }
  }

  anomalies.sort((a, b) => b.anomalies.length - a.anomalies.length)
  return anomalies
}
