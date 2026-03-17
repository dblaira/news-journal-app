'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Extraction, ExtractionBatchResult, ExtractionWithEntryDate, MapNode } from '@/types/extraction'
import { InfluenceMap } from '@/components/influence-map'
import { aggregateExtractions } from '@/lib/extractions/aggregate'

interface BatchInfo {
  batch_id: string
  created_at: string
  count: number
}

interface ExtractionsReviewProps {
  initialExtractions: Extraction[]
  allExtractions: ExtractionWithEntryDate[]
  initialBatchId: string | null
  batches: BatchInfo[]
  totalEntries: number
  mapNodes: MapNode[]
  parentMapNodes?: MapNode[] | null
}

function filterExtractionsByNode(
  extractions: ExtractionWithEntryDate[],
  node: MapNode
): Extraction[] {
  if (node.nodeLevel === 'parent') {
    return extractions.filter(e => e.parent_category === node.category)
  }

  if (node.type === 'category') {
    return extractions.filter(e => e.category === node.category)
  }

  return extractions.filter(e => {
    if (e.category !== node.category) return false
    return Object.values(e.data).some(
      v => typeof v === 'string' && v.toLowerCase() === node.label
    )
  })
}

export function ExtractionsReview({
  initialExtractions,
  allExtractions,
  initialBatchId,
  batches: initialBatches,
  totalEntries,
  mapNodes,
  parentMapNodes,
}: ExtractionsReviewProps) {
  const router = useRouter()
  const [extractions, setExtractions] = useState(initialExtractions)
  const [activeBatchId, setActiveBatchId] = useState(initialBatchId)
  const [batches] = useState(initialBatches)
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<ExtractionBatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map')
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null)
  const [drillParent, setDrillParent] = useState<string | null>(null)

  const activeMapNodes = useMemo(() => {
    if (!parentMapNodes) return mapNodes

    if (!drillParent) return parentMapNodes

    const childExtractions = allExtractions.filter(
      e => e.parent_category === drillParent
    )
    return aggregateExtractions(childExtractions)
  }, [parentMapNodes, mapNodes, drillParent, allExtractions])

  const displayExtractions = useMemo(() => {
    if (viewMode === 'map' || !selectedNode) return extractions
    return filterExtractionsByNode(allExtractions, selectedNode)
  }, [viewMode, selectedNode, extractions, allExtractions])

  const grouped = new Map<string, Extraction[]>()
  for (const ext of displayExtractions) {
    if (!grouped.has(ext.category)) {
      grouped.set(ext.category, [])
    }
    grouped.get(ext.category)!.push(ext)
  }
  const categories = Array.from(grouped.keys()).sort()

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedCategories(new Set(categories))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  const handleSelectNode = (node: MapNode) => {
    if (node.nodeLevel === 'parent') {
      setDrillParent(node.category)
      return
    }
    setSelectedNode(node)
    setViewMode('cards')
    setExpandedCategories(new Set([node.category]))
  }

  const handleBackToMap = () => {
    if (viewMode === 'cards') {
      setViewMode('map')
      setSelectedNode(null)
      setExpandedCategories(new Set())
      return
    }
    if (drillParent) {
      setDrillParent(null)
    }
  }

  const handleRunExtraction = async () => {
    setIsRunning(true)
    setError(null)
    setRunResult(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Extraction failed')
        return
      }

      setRunResult(data)

      if (data.batch_id) {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsRunning(false)
    }
  }

  const handleBatchChange = async (batchId: string) => {
    setActiveBatchId(batchId)
    setViewMode('cards')
    setSelectedNode(null)
    try {
      const response = await fetch(`/api/extract/batch?batchId=${batchId}`)
      const data = await response.json()
      if (data.extractions) {
        setExtractions(data.extractions)
        setExpandedCategories(new Set())
      }
    } catch {
      console.error('Failed to load batch')
    }
  }

  const confidenceLabel = (c: number) => {
    if (c >= 0.9) return 'explicit'
    if (c >= 0.6) return 'implied'
    return 'inferred'
  }

  const confidenceColor = (c: number) => {
    if (c >= 0.9) return '#16a34a'
    if (c >= 0.6) return '#ca8a04'
    return '#9ca3af'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-body, #FFFFFF)',
      color: 'var(--text-primary, #000)',
    }}>
      {/* Header banner — Level 2 */}
      <div style={{
        background: '#F5F0E8',
        borderBottom: '2px solid var(--color-red, #DC143C)',
        padding: '2rem 1.5rem',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/')}
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
            &larr; Back to Journal
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
            Extractions
          </h1>
          <p style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.95rem',
            color: 'var(--text-muted, #666)',
            marginTop: '0.5rem',
            lineHeight: 1.6,
          }}>
            {viewMode === 'map'
              ? 'Tap a circle to explore patterns in your journal'
              : selectedNode
                ? `Showing ${selectedNode.type === 'concept' ? `"${selectedNode.label}" in ` : ''}${selectedNode.category}`
                : 'Structured data extracted from your journal entries'
            }
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: viewMode === 'map' ? '100%' : '960px',
        margin: '0 auto',
        padding: viewMode === 'map' ? '1rem 1.5rem' : '2rem 1.5rem',
        background: viewMode === 'map' ? '#E8E2D8' : 'transparent',
        minHeight: viewMode === 'map' ? 'calc(100vh - 200px)' : 'auto',
      }}>
        {/* Controls row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: viewMode === 'map' ? '0.5rem' : '2rem',
          maxWidth: '960px',
          margin: viewMode === 'map' ? '0 auto 0.5rem' : '0',
        }}>
          {viewMode === 'cards' && (
            <button
              onClick={handleBackToMap}
              style={{
                background: 'none',
                border: '1px solid rgba(0,0,0,0.15)',
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary, #000)',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                transition: 'background 200ms ease-out',
              }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = 'rgba(0,0,0,0.04)' }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = 'none' }}
            >
              &larr; Influence Map
            </button>
          )}

          <button
            onClick={handleRunExtraction}
            disabled={isRunning}
            style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, serif",
              fontSize: '1.05rem',
              fontWeight: 400,
              background: isRunning ? '#666' : 'var(--color-red, #DC143C)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'background 200ms ease-out',
              opacity: isRunning ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!isRunning) (e.target as HTMLButtonElement).style.background = 'var(--color-red-dark, #B01030)' }}
            onMouseLeave={(e) => { if (!isRunning) (e.target as HTMLButtonElement).style.background = 'var(--color-red, #DC143C)' }}
          >
            {isRunning ? 'Extracting...' : 'Run Extraction'}
          </button>

          <button
            onClick={() => router.push('/extractions/correlations')}
            style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, serif",
              fontSize: '1.05rem',
              fontWeight: 400,
              background: '#1A1A1A',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              transition: 'background 200ms ease-out',
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#333' }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#1A1A1A' }}
          >
            Correlations
          </button>

          {viewMode === 'cards' && batches.length > 1 && !selectedNode && (
            <select
              value={activeBatchId || ''}
              onChange={(e) => handleBatchChange(e.target.value)}
              style={{
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '0.85rem',
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(0,0,0,0.15)',
                background: '#fff',
                color: '#1A1A1A',
                cursor: 'pointer',
              }}
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {new Date(b.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })} &mdash; {b.count} extractions
                </option>
              ))}
            </select>
          )}

          <span style={{
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '0.75rem',
            color: 'var(--text-muted, #666)',
            fontWeight: 600,
            letterSpacing: '0.08rem',
            textTransform: 'uppercase' as const,
          }}>
            {totalEntries} total entries
          </span>
        </div>

        {/* Run result feedback */}
        {runResult && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-inter), sans-serif',
            lineHeight: 1.6,
            maxWidth: '960px',
            margin: '0 auto 1.5rem',
          }}>
            <strong>Extraction complete.</strong>{' '}
            {runResult.total_entries_processed} entries processed.{' '}
            {runResult.total_extractions_found} extractions found.{' '}
            {runResult.categories_found.length} categories: {runResult.categories_found.join(', ') || 'none'}.{' '}
            Batch ID: {runResult.batch_id?.slice(0, 8)}...
          </div>
        )}

        {runResult && runResult.total_extractions_found === 0 && !runResult.batch_id && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-inter), sans-serif',
            maxWidth: '960px',
            margin: '0 auto 1.5rem',
          }}>
            {runResult.message || 'No new entries to extract.'}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-inter), sans-serif',
            color: '#991b1b',
            maxWidth: '960px',
            margin: '0 auto 1.5rem',
          }}>
            {error}
          </div>
        )}

        {/* Map View — stays mounted so positions persist across drill-down */}
        <div style={{ display: viewMode === 'map' ? 'block' : 'none' }}>
          {isRunning && allExtractions.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
            }}>
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
                Extracting...
              </p>
              <p style={{
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '0.85rem',
                color: 'var(--text-muted, #666)',
                marginTop: '0.5rem',
              }}>
                Processing entries through Claude. This may take a minute.
              </p>
            </div>
          )}

          {drillParent && (
            <button
              onClick={handleBackToMap}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                marginBottom: '1rem',
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '6px',
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                color: '#1A1A1A',
                cursor: 'pointer',
              }}
            >
              &larr; All categories
            </button>
          )}

          {drillParent && (
            <div style={{
              fontFamily: 'var(--font-bodoni-moda), Georgia, serif',
              fontSize: '1.6rem',
              color: '#1A1A1A',
              marginBottom: '1rem',
            }}>
              {drillParent}
            </div>
          )}

          <InfluenceMap nodes={activeMapNodes} onSelectNode={handleSelectNode} />
        </div>

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {/* Summary bar */}
            {displayExtractions.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2rem',
                marginBottom: '2rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}>
                <div>
                  <div style={{
                    fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                    fontSize: '2rem',
                    fontWeight: 400,
                    color: '#1A1A1A',
                  }}>
                    {displayExtractions.length}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.1rem',
                    textTransform: 'uppercase' as const,
                    color: 'var(--text-muted, #666)',
                  }}>
                    Extractions
                  </div>
                </div>
                <div>
                  <div style={{
                    fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                    fontSize: '2rem',
                    fontWeight: 400,
                    color: '#1A1A1A',
                  }}>
                    {categories.length}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.1rem',
                    textTransform: 'uppercase' as const,
                    color: 'var(--text-muted, #666)',
                  }}>
                    Categories
                  </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <button
                    onClick={expandAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-inter), sans-serif',
                      fontSize: '0.75rem',
                      color: 'var(--color-red, #DC143C)',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontWeight: 600,
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-inter), sans-serif',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted, #666)',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontWeight: 600,
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {displayExtractions.length === 0 && !isRunning && !runResult && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
              }}>
                <p style={{
                  fontFamily: "var(--font-bodoni-moda), Georgia, serif",
                  fontSize: '1.6rem',
                  color: '#1A1A1A',
                  marginBottom: '0.75rem',
                }}>
                  No extractions yet
                </p>
                <p style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: '0.95rem',
                  color: 'var(--text-muted, #666)',
                  maxWidth: '45ch',
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}>
                  Click &ldquo;Run Extraction&rdquo; to process your journal entries and discover structured patterns.
                </p>
              </div>
            )}

            {/* Loading state */}
            {isRunning && displayExtractions.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
              }}>
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
                  Extracting...
                </p>
                <p style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted, #666)',
                  marginTop: '0.5rem',
                }}>
                  Processing entries through Claude. This may take a minute.
                </p>
              </div>
            )}

            {/* Category groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.map(cat => {
                const items = grouped.get(cat)!
                const isExpanded = expandedCategories.has(cat)

                return (
                  <div key={cat} style={{
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        padding: '1rem 0',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.1rem',
                        textTransform: 'uppercase' as const,
                        color: 'var(--color-red, #DC143C)',
                      }}>
                        {cat}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--text-muted, #666)',
                        background: 'rgba(0,0,0,0.04)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '2px',
                      }}>
                        {items.length}
                      </span>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted, #666)',
                        transition: 'transform 250ms ease-in-out',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}>
                        &#x25BC;
                      </span>
                    </button>

                    {isExpanded && (
                      <div style={{
                        paddingBottom: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}>
                        {items.map(ext => (
                          <div
                            key={ext.id}
                            style={{
                              padding: '1rem 1.25rem',
                              background: 'var(--bg-card, #fff)',
                              borderLeft: `3px solid ${confidenceColor(ext.confidence)}`,
                              transition: 'transform 200ms ease-out',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)' }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem',
                            }}>
                              <span style={{
                                fontFamily: 'var(--font-inter), sans-serif',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.08rem',
                                textTransform: 'uppercase' as const,
                                color: confidenceColor(ext.confidence),
                              }}>
                                {confidenceLabel(ext.confidence)} ({ext.confidence})
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.5rem 1.5rem',
                              marginBottom: ext.source_text ? '0.75rem' : 0,
                            }}>
                              {Object.entries(ext.data).map(([key, value]) => (
                                <div key={key}>
                                  <span style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: 'var(--text-muted, #666)',
                                    letterSpacing: '0.04rem',
                                  }}>
                                    {key}
                                  </span>
                                  <div style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '0.95rem',
                                    color: '#1A1A1A',
                                    fontWeight: 400,
                                  }}>
                                    {String(value)}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {ext.source_text && (
                              <div style={{
                                fontFamily: 'var(--font-inter), sans-serif',
                                fontSize: '0.85rem',
                                color: 'var(--text-muted, #666)',
                                fontStyle: 'italic',
                                lineHeight: 1.5,
                                borderTop: '1px solid rgba(0,0,0,0.04)',
                                paddingTop: '0.5rem',
                              }}>
                                &ldquo;{ext.source_text}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
