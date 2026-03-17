export interface WeekRow {
  weekKey: string
  year: number
  week: number
  counts: Record<string, number>
  total: number
}

export interface DomainBreakdown {
  [weekKey: string]: {
    [category: string]: {
      [domain: string]: number
    }
  }
}

export interface WeeklyMatrix {
  weeks: WeekRow[]
  categories: string[]
  domainBreakdown: DomainBreakdown
  dateRange: { start: string; end: string }
  totalExtractions: number
}

export interface CorrelationPair {
  categoryA: string
  categoryB: string
  coefficient: number
  lag: number
  type: 'co-movement' | 'inverse' | 'leading'
}

export interface CategoryAnomaly {
  category: string
  value: number
  mean: number
  stdDev: number
  zScore: number
  direction: 'spike' | 'drop'
}

export interface AnomalyWeek {
  weekKey: string
  anomalies: CategoryAnomaly[]
  domainBreakdown: Record<string, Record<string, number>>
}

export interface CategoryStats {
  category: string
  mean: number
  stdDev: number
  weeksWithData: number
  totalCount: number
  coveragePercent: number
}

export interface CorrelationResult {
  correlations: CorrelationPair[]
  anomalyWeeks: AnomalyWeek[]
  categoryStats: CategoryStats[]
  matrix: WeeklyMatrix
}

export interface ClaudeInterpretation {
  behavioral_signatures: {
    name: string
    description: string
    categories: string[]
    typical_duration: string
  }[]
  tension_signals: {
    description: string
    pair: [string, string]
    coefficient: number
  }[]
  leading_indicators: {
    description: string
    leader: string
    follower: string
    lag_weeks: number
  }[]
  anomaly_narratives: {
    week: string
    narrative: string
  }[]
  blind_spots: string[]
}

export interface CorrelationAnalysis {
  id: string
  user_id: string
  created_at: string
  date_range_start: string
  date_range_end: string
  total_weeks: number
  total_extractions: number
  correlations: CorrelationPair[]
  anomaly_weeks: AnomalyWeek[]
  category_stats: CategoryStats[]
  interpretation: ClaudeInterpretation | null
}
