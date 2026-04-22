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
  const [showHowItWorks, setShowHowItWorks] = useState(true)

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
        <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1rem', fontSize: '1rem', lineHeight: 1.5 }}>
          In one line: when you capture a note, the app picks <strong style={{ color: 'rgba(255,255,255,0.85)' }}>life domains</strong> (same
          labels as the sidebar) and feeds your <strong style={{ color: 'rgba(255,255,255,0.85)' }}>if→then rules</strong> into the model so
          answers stay on your worldview—not a generic chatbot.
        </p>

        <div
          style={{
            marginBottom: '1.75rem',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setShowHowItWorks((v) => !v)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.85rem 1rem',
              background: 'rgba(255,255,255,0.04)',
              border: 'none',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span>{showHowItWorks ? '▼' : '▶'} How this page maps to the app</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{showHowItWorks ? 'Hide' : 'Show'}</span>
          </button>
          {showHowItWorks && (
            <ul
              style={{
                margin: 0,
                padding: '1rem 1.25rem 1.15rem',
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.88rem',
                lineHeight: 1.55,
              }}
            >
              <li>
                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Life domain</strong> — a bucket like Exercise or Learning. Stored on
                entries and used in the sidebar; the infer API returns these after you save.
              </li>
              <li>
                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Rule (we still call it an axiom in the DB)</strong> — plain English “if
                this, then that” plus a confidence. Rows in <code style={{ color: 'rgba(255,255,255,0.55)' }}>ontology_axioms</code> get
                stitched into the prompt in <code style={{ color: 'rgba(255,255,255,0.55)' }}>build-prompt-section</code>.
              </li>
              <li>
                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Inference here</strong> — the LLM reading your text + rules, not an OWL
                reasoner. There is no separate logic engine to learn.
              </li>
              <li>
                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Insights below</strong> — optional weekly summaries once something writes to{' '}
                <code style={{ color: 'rgba(255,255,255,0.55)' }}>inferred_insights</code>; empty is normal today.
              </li>
            </ul>
          )}
        </div>

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
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem', fontWeight: 600 }}>Rules the model sees</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                Pulled from <code style={{ color: 'rgba(255,255,255,0.55)' }}>ontology_axioms</code>. Each line is “if → then” in your words.
              </p>
              {axioms.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)' }}>No rules in the database yet.</p>
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
                      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        <p style={{ color: 'rgba(255,255,255,0.45)', margin: '0 0 0.25rem' }}>
                          <strong style={{ color: 'rgba(255,255,255,0.65)' }}>If</strong> {axiom.antecedent}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                          <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Then</strong> {axiom.consequent}
                        </p>
                      </div>
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
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem', fontWeight: 600 }}>Stored summaries</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                Longer “so what” blurbs saved to the DB—not the same as the quick tags on each capture.
              </p>
              {insights.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Nothing here yet. That is expected until a job or API writes rows into{' '}
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
