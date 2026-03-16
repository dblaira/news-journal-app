'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OntologyProposal, OntologyParent } from '@/types/extraction'

interface CategoryDetail {
  label: string
  count: number
  domains: string[]
}

interface ProposalResponse {
  proposal: OntologyProposal
  stats: {
    unique_categories: number
    total_extractions: number
    parents_proposed: number
    children_mapped: number
    unmapped_count: number
  }
  category_details: CategoryDetail[]
}

interface ApplyResponse {
  total_mappings: number
  total_extractions_updated: number
  per_parent: Record<string, number>
}

interface OntologyReviewProps {
  totalExtractions: number
}

export function OntologyReview({ totalExtractions }: OntologyReviewProps) {
  const router = useRouter()
  const [isProposing, setIsProposing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ProposalResponse | null>(null)
  const [applyResult, setApplyResult] = useState<ApplyResponse | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [editingParent, setEditingParent] = useState<string | null>(null)
  const [editingChild, setEditingChild] = useState<string | null>(null)

  const proposal = response?.proposal ?? null
  const categoryLookup = new Map(
    (response?.category_details ?? []).map(c => [c.label, c])
  )

  const handlePropose = async () => {
    setIsProposing(true)
    setError(null)
    setApplyResult(null)

    try {
      const res = await fetch('/api/ontology/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Proposal failed')
        return
      }

      setResponse(data)
      setExpandedParents(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsProposing(false)
    }
  }

  const handleApply = async () => {
    if (!proposal) return

    setIsApplying(true)
    setError(null)

    try {
      const res = await fetch('/api/ontology/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ontology: proposal.ontology }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Apply failed')
        return
      }

      setApplyResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsApplying(false)
    }
  }

  const toggleParent = (parent: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev)
      if (next.has(parent)) next.delete(parent)
      else next.add(parent)
      return next
    })
  }

  const expandAll = () => {
    if (!proposal) return
    setExpandedParents(new Set(proposal.ontology.map(g => g.parent)))
  }

  const collapseAll = () => setExpandedParents(new Set())

  const updateParentName = (oldName: string, newName: string) => {
    if (!response || !newName.trim()) return
    setResponse({
      ...response,
      proposal: {
        ...response.proposal,
        ontology: response.proposal.ontology.map(g =>
          g.parent === oldName ? { ...g, parent: newName.trim() } : g
        ),
      },
    })
    setExpandedParents(prev => {
      const next = new Set(prev)
      if (next.has(oldName)) {
        next.delete(oldName)
        next.add(newName.trim())
      }
      return next
    })
    setEditingParent(null)
  }

  const updateChildLabel = (parentName: string, oldLabel: string, newLabel: string) => {
    if (!response || !newLabel.trim()) return
    setResponse({
      ...response,
      proposal: {
        ...response.proposal,
        ontology: response.proposal.ontology.map(g =>
          g.parent === parentName
            ? { ...g, children: g.children.map(c => c === oldLabel ? newLabel.trim().toLowerCase() : c) }
            : g
        ),
      },
    })
    setEditingChild(null)
  }

  const moveChild = (fromParent: string, childLabel: string, toParent: string) => {
    if (!response || fromParent === toParent) return
    setResponse({
      ...response,
      proposal: {
        ...response.proposal,
        ontology: response.proposal.ontology.map(g => {
          if (g.parent === fromParent) {
            return { ...g, children: g.children.filter(c => c !== childLabel) }
          }
          if (g.parent === toParent) {
            return { ...g, children: [...g.children, childLabel] }
          }
          return g
        }),
      },
    })
  }

  const removeChild = (parentName: string, childLabel: string) => {
    if (!response) return
    setResponse({
      ...response,
      proposal: {
        ...response.proposal,
        ontology: response.proposal.ontology.map(g =>
          g.parent === parentName
            ? { ...g, children: g.children.filter(c => c !== childLabel) }
            : g
        ),
        unmapped: [...response.proposal.unmapped, childLabel],
      },
    })
  }

  const assignUnmapped = (label: string, parentName: string) => {
    if (!response) return
    setResponse({
      ...response,
      proposal: {
        ...response.proposal,
        ontology: response.proposal.ontology.map(g =>
          g.parent === parentName
            ? { ...g, children: [...g.children, label] }
            : g
        ),
        unmapped: response.proposal.unmapped.filter(l => l !== label),
      },
    })
  }

  const deleteParent = (parentName: string) => {
    if (!response) return
    const group = response.proposal.ontology.find(g => g.parent === parentName)
    if (!group) return
    setResponse({
      ...response,
      proposal: {
        ...response.proposal,
        ontology: response.proposal.ontology.filter(g => g.parent !== parentName),
        unmapped: [...response.proposal.unmapped, ...group.children],
      },
    })
  }

  const mergeParents = (sourceParent: string, targetParent: string) => {
    if (!response || sourceParent === targetParent) return
    const sourceGroup = response.proposal.ontology.find(g => g.parent === sourceParent)
    if (!sourceGroup) return
    setResponse({
      ...response,
      proposal: {
        ...response.proposal,
        ontology: response.proposal.ontology
          .filter(g => g.parent !== sourceParent)
          .map(g =>
            g.parent === targetParent
              ? { ...g, children: [...g.children, ...sourceGroup.children] }
              : g
          ),
      },
    })
  }

  const getChildExtractionCount = (label: string): number => {
    return categoryLookup.get(label)?.count ?? 0
  }

  const getChildDomains = (label: string): string[] => {
    return categoryLookup.get(label)?.domains ?? []
  }

  const getParentExtractionCount = (group: OntologyParent): number => {
    return group.children.reduce((sum, c) => sum + getChildExtractionCount(c), 0)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-body, #FFFFFF)',
      color: 'var(--text-primary, #000)',
    }}>
      {/* Header */}
      <div style={{
        background: '#F5F0E8',
        borderBottom: '2px solid var(--color-red, #DC143C)',
        padding: '2rem 1.5rem',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/extractions')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #666)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '1rem',
              fontFamily: 'var(--font-inter)',
            }}
          >
            &larr; Back to Extractions
          </button>
          <h1 style={{
            fontFamily: "var(--font-bodoni-moda), Georgia, serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
            margin: 0,
          }}>
            Ontology
          </h1>
          <p style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.95rem',
            color: 'var(--text-muted, #666)',
            marginTop: '0.5rem',
            lineHeight: 1.6,
          }}>
            Collapse {totalExtractions} extractions into a clean parent/child hierarchy
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={handlePropose}
            disabled={isProposing}
            style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, serif",
              fontSize: '1.05rem',
              fontWeight: 400,
              background: isProposing ? '#666' : 'var(--color-red, #DC143C)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              cursor: isProposing ? 'not-allowed' : 'pointer',
              transition: 'background 200ms ease-out',
              opacity: isProposing ? 0.6 : 1,
            }}
          >
            {isProposing ? 'Proposing...' : proposal ? 'Re-propose Ontology' : 'Propose Ontology'}
          </button>

          {proposal && !applyResult && (
            <button
              onClick={handleApply}
              disabled={isApplying}
              style={{
                fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                fontSize: '1.05rem',
                fontWeight: 400,
                background: isApplying ? '#666' : '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                cursor: isApplying ? 'not-allowed' : 'pointer',
                transition: 'background 200ms ease-out',
                opacity: isApplying ? 0.6 : 1,
              }}
            >
              {isApplying ? 'Applying...' : 'Approve & Apply'}
            </button>
          )}

          {proposal && (
            <>
              <button onClick={expandAll} style={linkButtonStyle}>Expand All</button>
              <button onClick={collapseAll} style={linkButtonStyle}>Collapse All</button>
            </>
          )}

          <span style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.75rem',
            color: 'var(--text-muted, #666)',
            fontWeight: 600,
            letterSpacing: '0.08rem',
            textTransform: 'uppercase' as const,
          }}>
            {totalExtractions} extractions
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-inter), sans-serif',
            color: '#991b1b',
          }}>
            {error}
          </div>
        )}

        {/* Apply result */}
        {applyResult && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-inter), sans-serif',
            lineHeight: 1.6,
          }}>
            <strong>Ontology applied.</strong>{' '}
            {applyResult.total_mappings} mappings written to ontology_categories.{' '}
            {applyResult.total_extractions_updated} extractions updated with parent_category.{' '}
            <br />
            {Object.entries(applyResult.per_parent)
              .sort(([, a], [, b]) => b - a)
              .map(([parent, count]) => `${parent}: ${count}`)
              .join(' · ')}
          </div>
        )}

        {/* Loading */}
        {isProposing && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(0,0,0,0.1)',
              borderTopColor: 'var(--color-red, #DC143C)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, serif",
              fontSize: '1.25rem',
              color: '#1A1A1A',
            }}>
              Building ontology proposal...
            </p>
            <p style={{
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '0.85rem',
              color: 'var(--text-muted, #666)',
              marginTop: '0.5rem',
            }}>
              Claude Opus is analyzing {totalExtractions} extractions. This may take 30-60 seconds.
            </p>
          </div>
        )}

        {/* Stats bar */}
        {response && !isProposing && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}>
            {[
              { value: response.stats.parents_proposed, label: 'Parents' },
              { value: response.stats.children_mapped, label: 'Children Mapped' },
              { value: response.stats.unique_categories, label: 'Original Labels' },
              { value: response.stats.unmapped_count, label: 'Unmapped' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{
                  fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                  fontSize: '2rem',
                  fontWeight: 400,
                  color: '#1A1A1A',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.1rem',
                  textTransform: 'uppercase' as const,
                  color: 'var(--text-muted, #666)',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ontology list */}
        {proposal && !isProposing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {proposal.ontology
              .sort((a, b) => getParentExtractionCount(b) - getParentExtractionCount(a))
              .map(group => {
                const isExpanded = expandedParents.has(group.parent)
                const parentCount = getParentExtractionCount(group)

                return (
                  <div key={group.parent} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    {/* Parent row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem 0',
                    }}>
                      <button
                        onClick={() => toggleParent(group.parent)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.75rem',
                          color: 'var(--text-muted, #666)',
                          transition: 'transform 250ms ease-in-out',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        &#x25BC;
                      </button>

                      {editingParent === group.parent ? (
                        <input
                          autoFocus
                          defaultValue={group.parent}
                          onBlur={(e) => updateParentName(group.parent, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateParentName(group.parent, (e.target as HTMLInputElement).value)
                            if (e.key === 'Escape') setEditingParent(null)
                          }}
                          style={{
                            fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                            fontSize: '1.4rem',
                            fontWeight: 400,
                            border: '1px solid var(--color-red, #DC143C)',
                            padding: '0.25rem 0.5rem',
                            outline: 'none',
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingParent(group.parent)}
                          style={{
                            fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                            fontSize: '1.4rem',
                            fontWeight: 400,
                            color: '#1A1A1A',
                            cursor: 'text',
                          }}
                          title="Click to rename"
                        >
                          {group.parent}
                        </span>
                      )}

                      <span style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--text-muted, #666)',
                        background: 'rgba(0,0,0,0.04)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '2px',
                      }}>
                        {group.children.length} children
                      </span>

                      <span style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--color-red, #DC143C)',
                        background: 'rgba(220, 20, 60, 0.08)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '2px',
                      }}>
                        {parentCount} extractions
                      </span>

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) mergeParents(group.parent, e.target.value)
                          }}
                          style={smallSelectStyle}
                        >
                          <option value="">Merge into...</option>
                          {proposal.ontology
                            .filter(g => g.parent !== group.parent)
                            .map(g => (
                              <option key={g.parent} value={g.parent}>{g.parent}</option>
                            ))}
                        </select>

                        <button
                          onClick={() => deleteParent(group.parent)}
                          style={{ ...linkButtonStyle, color: '#991b1b', fontSize: '0.7rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {isExpanded && group.description && (
                      <p style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted, #666)',
                        margin: '0 0 0.75rem 1.75rem',
                        lineHeight: 1.5,
                        fontStyle: 'italic',
                      }}>
                        {group.description}
                      </p>
                    )}

                    {isExpanded && group.merge_note && (
                      <p style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.75rem',
                        color: '#ca8a04',
                        margin: '0 0 1rem 1.75rem',
                      }}>
                        {group.merge_note}
                      </p>
                    )}

                    {/* Children */}
                    {isExpanded && (
                      <div style={{
                        paddingBottom: '1rem',
                        paddingLeft: '1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}>
                        {group.children
                          .sort((a, b) => getChildExtractionCount(b) - getChildExtractionCount(a))
                          .map(child => (
                            <div
                              key={child}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.4rem 0.75rem',
                                background: 'var(--bg-card-alt, #FAFAFA)',
                                borderLeft: '2px solid rgba(0,0,0,0.06)',
                              }}
                            >
                              {editingChild === `${group.parent}::${child}` ? (
                                <input
                                  autoFocus
                                  defaultValue={child}
                                  onBlur={(e) => updateChildLabel(group.parent, child, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') updateChildLabel(group.parent, child, (e.target as HTMLInputElement).value)
                                    if (e.key === 'Escape') setEditingChild(null)
                                  }}
                                  style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '0.85rem',
                                    border: '1px solid var(--color-red, #DC143C)',
                                    padding: '0.15rem 0.4rem',
                                    outline: 'none',
                                  }}
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingChild(`${group.parent}::${child}`)}
                                  style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '0.85rem',
                                    color: '#1A1A1A',
                                    cursor: 'text',
                                    minWidth: '120px',
                                  }}
                                  title="Click to rename"
                                >
                                  {child}
                                </span>
                              )}

                              <span style={{
                                fontFamily: 'var(--font-inter), sans-serif',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: 'var(--text-muted, #666)',
                              }}>
                                {getChildExtractionCount(child)} extractions
                              </span>

                              <span style={{
                                fontFamily: 'var(--font-inter), sans-serif',
                                fontSize: '0.6rem',
                                color: 'var(--text-ghost, #999)',
                              }}>
                                {getChildDomains(child).join(', ')}
                              </span>

                              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) moveChild(group.parent, child, e.target.value)
                                  }}
                                  style={smallSelectStyle}
                                >
                                  <option value="">Move to...</option>
                                  {proposal.ontology
                                    .filter(g => g.parent !== group.parent)
                                    .map(g => (
                                      <option key={g.parent} value={g.parent}>{g.parent}</option>
                                    ))}
                                </select>

                                <button
                                  onClick={() => removeChild(group.parent, child)}
                                  style={{ ...linkButtonStyle, color: '#991b1b', fontSize: '0.65rem' }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}

            {/* Unmapped section */}
            {proposal.unmapped.length > 0 && (
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: '#fffbeb',
                border: '1px solid #fde68a',
              }}>
                <h3 style={{
                  fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 400,
                  color: '#1A1A1A',
                  margin: '0 0 1rem',
                }}>
                  Unmapped ({proposal.unmapped.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {proposal.unmapped.map(label => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.4rem 0',
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.85rem',
                        color: '#1A1A1A',
                        minWidth: '120px',
                      }}>
                        {label}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: 'var(--text-muted, #666)',
                      }}>
                        {getChildExtractionCount(label)} extractions
                      </span>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) assignUnmapped(label, e.target.value)
                        }}
                        style={smallSelectStyle}
                      >
                        <option value="">Assign to...</option>
                        {proposal.ontology.map(g => (
                          <option key={g.parent} value={g.parent}>{g.parent}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proposed new */}
            {proposal.proposed_new.length > 0 && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.5rem',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
              }}>
                <h3 style={{
                  fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                  fontSize: '1.1rem',
                  fontWeight: 400,
                  color: '#1A1A1A',
                  margin: '0 0 0.5rem',
                }}>
                  Proposed New Parent Categories
                </h3>
                <p style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted, #666)',
                  margin: 0,
                }}>
                  {proposal.proposed_new.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!proposal && !isProposing && !error && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, serif",
              fontSize: '1.6rem',
              color: '#1A1A1A',
              marginBottom: '0.75rem',
            }}>
              Build your ontology
            </p>
            <p style={{
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '0.95rem',
              color: 'var(--text-muted, #666)',
              maxWidth: '50ch',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Click &ldquo;Propose Ontology&rdquo; to have Claude analyze your {totalExtractions} extractions and suggest a parent/child category hierarchy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '0.75rem',
  color: 'var(--color-red, #DC143C)',
  cursor: 'pointer',
  padding: '0.25rem 0.5rem',
  fontWeight: 600,
}

const smallSelectStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '0.7rem',
  padding: '0.2rem 0.4rem',
  border: '1px solid rgba(0,0,0,0.15)',
  background: '#fff',
  color: '#1A1A1A',
  cursor: 'pointer',
}
