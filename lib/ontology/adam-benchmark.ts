import type { LifeDomain, OntologyRelationshipType } from '@/types/ontology'

export interface AdamBenchmarkAxiom {
  name: string
  antecedent: string
  consequent: string
  confidence: number
  relationshipType: OntologyRelationshipType
  domains: LifeDomain[]
  extractionCount: number
  purpose: 'benchmark'
}

export const ADAM_EXAMPLE_EXTRACTION_COUNT = 8069

/** Adam's ontology is proof material for demos and evaluation, never a default user truth. */
export const ADAM_BENCHMARK_AXIOMS: readonly AdamBenchmarkAxiom[] = [
  {
    name: 'Learning Master Key',
    antecedent: 'High Learning',
    consequent: 'Higher Affect, Ambition, and Insight',
    confidence: 0.67,
    relationshipType: 'predicts',
    domains: ['Learning', 'Affect', 'Ambition', 'Insight'],
    extractionCount: ADAM_EXAMPLE_EXTRACTION_COUNT,
    purpose: 'benchmark',
  },
  {
    name: 'Exercise-Sleep Synergy',
    antecedent: 'High Exercise + High Sleep',
    consequent: 'Excellent stress recovery',
    confidence: 0.57,
    relationshipType: 'predicts',
    domains: ['Exercise', 'Sleep', 'Health', 'Affect'],
    extractionCount: ADAM_EXAMPLE_EXTRACTION_COUNT,
    purpose: 'benchmark',
  },
]
