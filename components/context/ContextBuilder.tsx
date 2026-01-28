'use client'

import { useState, useEffect } from 'react'
import ContextChip from './ContextChip'
import ContextSummaryLine, { ContextItem } from './ContextSummaryLine'
import {
  CONTEXT_CATEGORIES,
  ContextCategoryKey,
  getCategoryEmoji,
  DEFAULT_CATEGORY_ORDER,
} from './constants'
import { EntryEnrichment, AutoCapturedMetadata } from '@/types/metadata'

interface ContextBuilderProps {
  metadata?: AutoCapturedMetadata
  enrichment: EntryEnrichment
  onEnrichmentChange: (enrichment: EntryEnrichment) => void
  contextOrder?: ContextCategoryKey[]
  onContextOrderChange?: (order: ContextCategoryKey[]) => void
  defaultExpanded?: boolean
  userId?: string
}

export default function ContextBuilder({
  metadata,
  enrichment,
  onEnrichmentChange,
  contextOrder = DEFAULT_CATEGORY_ORDER,
  onContextOrderChange,
  defaultExpanded = true,
  userId,
}: ContextBuilderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [customInputs, setCustomInputs] = useState<Record<ContextCategoryKey, string>>({
    location: '',
    environment: '',
    activity: '',
    energy: '',
    mood: '',
    trigger: '',
  })
  const [showCustomInput, setShowCustomInput] = useState<ContextCategoryKey | null>(null)
  const [userCustomTags, setUserCustomTags] = useState<Record<string, string[]>>({})

  // Fetch user's custom tags on mount
  useEffect(() => {
    if (userId) {
      fetchUserPreferences()
    }
  }, [userId])

  const fetchUserPreferences = async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/user-preferences?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const grouped: Record<string, string[]> = {}
        data.preferences?.forEach((pref: { preference_type: string; value: string }) => {
          if (!grouped[pref.preference_type]) {
            grouped[pref.preference_type] = []
          }
          grouped[pref.preference_type].push(pref.value)
        })
        setUserCustomTags(grouped)
      }
    } catch (error) {
      console.log('Failed to fetch user preferences:', error)
    }
  }

  // Build context items from enrichment for summary line
  const buildContextItems = (): ContextItem[] => {
    const items: ContextItem[] = []

    // Follow the order
    for (const category of contextOrder) {
      const value = getEnrichmentValue(category)
      if (value) {
        items.push({ category, value: Array.isArray(value) ? value.join(', ') : value })
      }
    }

    return items
  }

  const getEnrichmentValue = (category: ContextCategoryKey): string | string[] | undefined => {
    switch (category) {
      case 'environment':
        return enrichment.environment
      case 'activity':
        return enrichment.activity
      case 'energy':
        return enrichment.energy
      case 'mood':
        return enrichment.mood
      case 'trigger':
        return enrichment.trigger
      default:
        return undefined
    }
  }

  const handleSelectOption = (category: ContextCategoryKey, value: string) => {
    const categoryConfig = CONTEXT_CATEGORIES[category]

    if (categoryConfig.type === 'multi-select') {
      // Multi-select: toggle in array
      const currentValues = (enrichment.mood as string[]) || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      onEnrichmentChange({
        ...enrichment,
        [category]: newValues.length > 0 ? newValues : undefined,
      })
    } else {
      // Single select: toggle on/off
      const currentValue = getEnrichmentValue(category)
      onEnrichmentChange({
        ...enrichment,
        [category]: currentValue === value ? undefined : value,
      })
    }

    // Track usage for learning
    if (userId) {
      trackPreferenceUsage(category, value)
    }
  }

  const handleCustomAdd = async (category: ContextCategoryKey) => {
    const value = customInputs[category]?.trim()
    if (!value) return

    handleSelectOption(category, value)

    // Save custom tag for future use
    if (userId) {
      try {
        await fetch('/api/user-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: category,
            value,
          }),
        })
        // Refresh custom tags
        fetchUserPreferences()
      } catch (error) {
        console.log('Failed to save custom tag:', error)
      }
    }

    // Clear input
    setCustomInputs((prev) => ({ ...prev, [category]: '' }))
    setShowCustomInput(null)
  }

  const trackPreferenceUsage = async (type: string, value: string) => {
    try {
      await fetch('/api/user-preferences/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, value }),
      })
    } catch {
      // Silent fail - not critical
    }
  }

  const handleReorder = (newItems: ContextItem[]) => {
    if (onContextOrderChange) {
      const newOrder = newItems.map((item) => item.category)
      onContextOrderChange(newOrder)
    }
  }

  const handleRemoveFromSummary = (index: number) => {
    const items = buildContextItems()
    const item = items[index]
    if (item) {
      onEnrichmentChange({
        ...enrichment,
        [item.category]: undefined,
      })
    }
  }

  const location = metadata?.location?.display_name || metadata?.location?.raw_name

  // Get all options for a category (presets + user custom)
  const getOptionsForCategory = (category: ContextCategoryKey): string[] => {
    const config = CONTEXT_CATEGORIES[category]
    const presets = 'presets' in config ? config.presets : []
    const custom = userCustomTags[category] || []
    return [...new Set([...presets, ...custom])]
  }

  const isSelected = (category: ContextCategoryKey, value: string): boolean => {
    if (category === 'mood') {
      return (enrichment.mood || []).includes(value)
    }
    return getEnrichmentValue(category) === value
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Summary Line (always visible) */}
      <ContextSummaryLine
        items={buildContextItems()}
        location={location}
        onReorder={handleReorder}
        onRemove={handleRemoveFromSummary}
        onClick={() => setExpanded(!expanded)}
        expanded={expanded}
        editable={true}
      />

      {/* Expanded Panel */}
      {expanded && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '1rem',
            background: '#FAFAFA',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          {/* Location (auto-captured, display only) */}
          {metadata?.location && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05rem',
                  color: '#6B7280',
                  marginBottom: '0.5rem',
                }}
              >
                <span>{getCategoryEmoji('location')}</span>
                Location
                <span
                  style={{
                    fontSize: '0.6rem',
                    background: '#E0F2FE',
                    color: '#0369A1',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    marginLeft: '0.3rem',
                  }}
                >
                  auto
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <ContextChip
                  emoji={getCategoryEmoji('location')}
                  label={location || 'Detecting...'}
                  selected={true}
                  variant="default"
                />
                {metadata.location.label && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#6B7280',
                      alignSelf: 'center',
                    }}
                  >
                    ({metadata.location.label})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Selectable categories */}
          {(['environment', 'activity', 'energy', 'mood'] as ContextCategoryKey[]).map(
            (category) => {
              const config = CONTEXT_CATEGORIES[category]
              const options = getOptionsForCategory(category)

              return (
                <div key={category} style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05rem',
                      color: '#6B7280',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>{getCategoryEmoji(category)}</span>
                    {config.label}
                    {config.type === 'multi-select' && (
                      <span style={{ fontSize: '0.6rem', color: '#9CA3AF' }}>(multi)</span>
                    )}
                  </label>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {options.map((option) => (
                      <ContextChip
                        key={option}
                        label={option}
                        selected={isSelected(category, option)}
                        onClick={() => handleSelectOption(category, option)}
                      />
                    ))}

                    {/* Custom input */}
                    {showCustomInput === category ? (
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={customInputs[category]}
                          onChange={(e) =>
                            setCustomInputs((prev) => ({ ...prev, [category]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCustomAdd(category)
                            if (e.key === 'Escape') setShowCustomInput(null)
                          }}
                          placeholder="Custom..."
                          autoFocus
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            border: '1px solid #DC143C',
                            fontSize: '0.85rem',
                            width: '120px',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomAdd(category)}
                          style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: '#22C55E',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomInput(null)}
                          style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: '#6B7280',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <ContextChip
                        label="Custom"
                        variant="custom"
                        onClick={() => setShowCustomInput(category)}
                      />
                    )}
                  </div>
                </div>
              )
            }
          )}

          {/* Trigger (free text) */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05rem',
                color: '#6B7280',
                marginBottom: '0.5rem',
              }}
            >
              <span>{getCategoryEmoji('trigger')}</span>
              {CONTEXT_CATEGORIES.trigger.label}
            </label>
            <input
              type="text"
              value={enrichment.trigger || ''}
              onChange={(e) =>
                onEnrichmentChange({
                  ...enrichment,
                  trigger: e.target.value || undefined,
                })
              }
              placeholder={CONTEXT_CATEGORIES.trigger.placeholder}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '0.9rem',
                background: '#FFFFFF',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#DC143C'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
