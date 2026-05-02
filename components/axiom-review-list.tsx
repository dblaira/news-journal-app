'use client'

import { useState, useTransition } from 'react'
import { updateOntologyAxiomStatus } from '@/app/actions/ontology'
import type { OntologyAxiomStatus } from '@/types/ontology'

export interface AxiomReviewItem {
  id: string
  name: string
  antecedent: string
  consequent: string
  confidence: number
  status: OntologyAxiomStatus
  scope: string
  evidence_count: number
}

interface AxiomReviewListProps {
  axioms: AxiomReviewItem[]
  unavailableReason?: string
}

export function AxiomReviewList({ axioms, unavailableReason }: AxiomReviewListProps) {
  const [items, setItems] = useState(axioms)
  const [error, setError] = useState<string | null>(unavailableReason ?? null)
  const [isPending, startTransition] = useTransition()

  function reviewAxiom(id: string, status: OntologyAxiomStatus) {
    setError(null)
    startTransition(async () => {
      const result = await updateOntologyAxiomStatus(id, status)
      if (result.error) {
        setError(result.error)
        return
      }
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item))
    })
  }

  return (
    <section style={{ marginBottom: '2rem', padding: '1.25rem', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: '#fff' }}>
      <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: '#DC143C', fontWeight: 700 }}>
        Personal axioms
      </p>
      <h2 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-bodoni-moda), Georgia, serif', fontSize: '1.6rem', fontWeight: 400 }}>
        Confirm what your record is allowed to believe
      </h2>
      <p style={{ margin: '0 0 1rem', color: '#666', fontSize: '0.92rem', lineHeight: 1.55 }}>
        Candidate axioms are hypotheses until you confirm them. Adam's demo axioms are never installed as your truths.
      </p>

      {error && <p style={{ color: '#B01030', fontSize: '0.85rem' }}>{error}</p>}
      {!error && items.length === 0 && <p style={{ color: '#666', fontSize: '0.9rem' }}>No candidate axioms yet.</p>}

      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {items.map((axiom) => (
          <article key={axiom.id} style={{ padding: '0.9rem', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
              <strong>{axiom.name}</strong>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06rem', color: axiom.status === 'confirmed' ? '#15803d' : '#666' }}>
                {axiom.status}
              </span>
            </div>
            <p style={{ margin: '0.5rem 0', color: '#333', fontSize: '0.9rem' }}>
              If {axiom.antecedent} then {axiom.consequent}
            </p>
            <p style={{ margin: 0, color: '#666', fontSize: '0.78rem' }}>
              Confidence {(axiom.confidence * 100).toFixed(0)}% · Scope {axiom.scope} · Evidence {axiom.evidence_count || 'not counted yet'}
            </p>
            {axiom.status === 'candidate' && axiom.scope === 'personal' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" disabled={isPending} onClick={() => reviewAxiom(axiom.id, 'confirmed')}>Confirm</button>
                <button type="button" disabled={isPending} onClick={() => reviewAxiom(axiom.id, 'rejected')}>Reject</button>
              </div>
            )}
            {axiom.status === 'confirmed' && axiom.scope === 'personal' && (
              <button type="button" disabled={isPending} onClick={() => reviewAxiom(axiom.id, 'retired')} style={{ marginTop: '0.75rem' }}>
                Retire
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
