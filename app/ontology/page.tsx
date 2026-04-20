'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { InferredInsight, OntologyAxiom } from '@/types/ontology'

type AxiomRow = {
  id: string
  name: string
  description: string | null
  antecedent: string
  consequent: string
  confidence: number | string
  sources: string[] | null
  created_at: string
}

type InsightRow = {
  id: string
  insight_text: string
  related_axioms: string[] | null
  confidence: number | string | null
  created_at: string
  week_start: string
}

function mapAxiom(row: AxiomRow): OntologyAxiom {
  const c = typeof row.confidence === 'number' ? row.confidence : Number(row.confidence)
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    antecedent: row.antecedent,
    consequent: row.consequent,
    confidence: Number.isFinite(c) ? c : 0,
    sources: row.sources ?? [],
    createdAt: new Date(row.created_at),
  }
}

function mapInsight(row: InsightRow): InferredInsight {
  const c = row.confidence == null ? 0 : typeof row.confidence === 'number' ? row.confidence : Number(row.confidence)
  return {
    id: row.id,
    weekStart: new Date(row.week_start),
    insightText: row.insight_text,
    relatedAxioms: (row.related_axioms ?? []).map(String),
    confidence: Number.isFinite(c) ? c : 0,
  }
}

export default function OntologyPage() {
  const router = useRouter()
  const [axioms, setAxioms] = useState<OntologyAxiom[]>([])
  const [insights, setInsights] = useState<InferredInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: axiomData, error: axiomErr } = await supabase
          .from('ontology_axioms')
          .select('id, name, description, antecedent, consequent, confidence, sources, created_at')
          .order('confidence', { ascending: false })

        const { data: insightData, error: insightErr } = await supabase
          .from('inferred_insights')
          .select('id, insight_text, related_axioms, confidence, created_at, week_start')
          .order('created_at', { ascending: false })
          .limit(10)

        if (cancelled) return

        if (axiomErr) {
          setError(axiomErr.message)
          setAxioms([])
        } else {
          setAxioms((axiomData as AxiomRow[] | null)?.map(mapAxiom) ?? [])
        }

        if (insightErr && !axiomErr) {
          setError(insightErr.message)
        }
        if (!insightErr) {
          setInsights((insightData as InsightRow[] | null)?.map(mapInsight) ?? [])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load ontology')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        padding: '2rem',
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '2rem',
          }}
        >
          ← Back
        </button>

        <h1
          style={{
            fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          Personal ontology
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Axioms and inferred insights. Entry categories and sidebar filters use the same life domains.
        </p>

        {loading && <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading…</p>}
        {error && (
          <p style={{ color: '#f87171', marginBottom: '1.5rem' }}>
            {error}
            <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              If this is the first setup, run <code style={{ color: 'rgba(255,255,255,0.6)' }}>database-migrations-ontology.sql</code> in the Supabase SQL editor.
            </span>
          </p>
        )}

        {!loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '2rem',
            }}
            className="ontology-grid"
          >
            <style jsx>{`
              @media (min-width: 900px) {
                .ontology-grid {
                  grid-template-columns: 1fr 1fr !important;
                }
              }
            `}</style>

            <section
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Active axioms</h2>
              {axioms.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)' }}>No axioms yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {axioms.map((axiom) => (
                    <li
                      key={axiom.id}
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{axiom.name}</h3>
                        <span style={{ color: '#4ade80', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {(axiom.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
                        {axiom.description}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.75rem', marginBottom: 0 }}>
                        {axiom.antecedent} → {axiom.consequent}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Inferred insights</h2>
              {insights.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)' }}>
                  No stored insights yet. These can be populated when you add a pipeline that writes to{' '}
                  <code style={{ color: 'rgba(255,255,255,0.6)' }}>inferred_insights</code>.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {insights.map((insight) => (
                    <li
                      key={insight.id}
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '1rem',
                      }}
                    >
                      <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.95rem' }}>{insight.insightText}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.75rem', marginBottom: 0 }}>
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
