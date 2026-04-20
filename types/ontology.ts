/** Primary ontology life domains — entry category and sidebar filters use this set. */
export type LifeDomain =
  | 'Exercise'
  | 'Sleep'
  | 'Nutrition'
  | 'Ambition'
  | 'Health'
  | 'Work'
  | 'Social'
  | 'Learning'
  | 'Purchase'
  | 'Belief'
  | 'Affect'
  | 'Insight'
  | 'Entertainment'

export const LIFE_DOMAINS: readonly LifeDomain[] = [
  'Exercise',
  'Sleep',
  'Nutrition',
  'Ambition',
  'Health',
  'Work',
  'Social',
  'Learning',
  'Purchase',
  'Belief',
  'Affect',
  'Insight',
  'Entertainment',
] as const

const LIFE_DOMAIN_SET = new Set<string>(LIFE_DOMAINS)

export function parseLifeDomains(raw: unknown): LifeDomain[] {
  if (!Array.isArray(raw)) return []
  const out: LifeDomain[] = []
  for (const item of raw) {
    if (typeof item === 'string' && LIFE_DOMAIN_SET.has(item)) {
      out.push(item as LifeDomain)
    }
  }
  return [...new Set(out)]
}

export interface OntologyAxiom {
  id: string
  name: string
  description: string
  antecedent: string
  consequent: string
  confidence: number
  sources: string[]
  createdAt: Date
}

export interface InferredInsight {
  id: string
  weekStart: Date
  insightText: string
  relatedAxioms: string[]
  confidence: number
}
