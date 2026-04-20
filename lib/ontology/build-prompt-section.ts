import { LIFE_DOMAINS } from '@/types/ontology'

export type OntologyAxiomPromptRow = {
  antecedent: string
  consequent: string
  confidence: number | string
}

/** Appended to infer-entry (and similar) system/user prompts. */
export function buildOntologyPromptSection(axioms: OntologyAxiomPromptRow[]): string {
  if (!axioms.length) return ''

  const lines = axioms.map((a) => {
    const c = typeof a.confidence === 'number' ? a.confidence : Number(a.confidence)
    const conf = Number.isFinite(c) ? c : 0
    return `- ${a.antecedent} → ${a.consequent} (confidence ${conf})`
  })

  const domainList = LIFE_DOMAINS.join(' | ')

  return `

## Personal ontology rules
Active axioms (use as formal hypotheses when classifying and tagging):
${lines.join('\n')}

Also set **life_domains** to zero or more values from this closed set (exact spelling, JSON array of strings):
${domainList}
Only include domains clearly supported by the entry text; otherwise use [].
`
}
