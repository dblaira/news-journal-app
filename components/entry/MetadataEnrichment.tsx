// components/entry/MetadataEnrichment.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import { EntryMetadata, EntryEnrichment, UserPreference } from '@/types/metadata'
import ChipSelector from '@/components/ui/ChipSelector'
import EditableField from '@/components/ui/EditableField'
import { ContextSummaryLine, ContextItem, ContextCategoryKey, DEFAULT_CATEGORY_ORDER } from '@/components/context'

interface MetadataEnrichmentProps {
  entryId: string
  metadata: EntryMetadata
  onUpdate: (metadata: EntryMetadata) => void
  userId: string
  entryContent?: string  // For AI inference
}

// Helper to format time
function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

export default function MetadataEnrichment({
  entryId,
  metadata,
  onUpdate,
  userId,
  entryContent,
}: MetadataEnrichmentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [enrichment, setEnrichment] = useState<EntryEnrichment>(metadata.enrichment || {})
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error' | null>(null)
  const [isInferring, setIsInferring] = useState(false)
  const [hasInferred, setHasInferred] = useState(false)
  const [contextOrder, setContextOrder] = useState<string[]>(
    metadata.enrichment?.context_order || DEFAULT_CATEGORY_ORDER
  )
  
  // Convert enrichment to ContextItem[] for the summary line
  const contextItems = useMemo((): ContextItem[] => {
    const items: ContextItem[] = []
    
    // Build items based on what's set
    if (enrichment.environment) {
      items.push({ category: 'environment', value: enrichment.environment })
    }
    if (enrichment.activity) {
      items.push({ category: 'activity', value: enrichment.activity })
    }
    if (enrichment.energy) {
      items.push({ category: 'energy', value: enrichment.energy })
    }
    if (enrichment.mood && enrichment.mood.length > 0) {
      items.push({ category: 'mood', value: enrichment.mood.join(', ') })
    }
    if (enrichment.trigger) {
      items.push({ category: 'trigger', value: enrichment.trigger })
    }
    
    // Sort by context_order
    return items.sort((a, b) => {
      const orderA = contextOrder.indexOf(a.category)
      const orderB = contextOrder.indexOf(b.category)
      return orderA - orderB
    })
  }, [enrichment, contextOrder])
  
  // Handle reorder from drag-and-drop
  const handleContextReorder = (newItems: ContextItem[]) => {
    const newOrder = newItems.map(item => item.category)
    setContextOrder(newOrder)
    // Also update the enrichment with the new order
    setEnrichment(prev => ({ ...prev, context_order: newOrder }))
  }
  
  // Load user's custom presets
  useEffect(() => {
    loadUserPreferences()
  }, [userId])
  
  // Auto-infer enrichment when panel is first expanded (if no existing enrichment)
  useEffect(() => {
    if (isExpanded && !hasInferred && entryContent && !metadata.enrichment) {
      inferEnrichment()
    }
  }, [isExpanded, hasInferred, entryContent, metadata.enrichment])
  
  const loadUserPreferences = async () => {
    try {
      const response = await fetch(`/api/user-preferences?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserPreferences(data.preferences || [])
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }
  
  // AI inference for enrichment fields
  const inferEnrichment = async () => {
    if (!entryContent || isInferring) return
    
    setIsInferring(true)
    try {
      const response = await fetch('/api/infer-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: entryContent,
          timeOfDay: metadata.time_of_day,
          dayOfWeek: metadata.day_of_week,
          location: metadata.location?.display_name,
        }),
      })
      
      if (response.ok) {
        const inferred = await response.json()
        setEnrichment(prev => ({
          ...prev,
          activity: inferred.activity || prev.activity,
          energy: inferred.energy || prev.energy,
          mood: inferred.mood || prev.mood,
          environment: inferred.environment || prev.environment,
          trigger: inferred.trigger || prev.trigger,
        }))
      }
    } catch (error) {
      console.error('Failed to infer enrichment:', error)
    } finally {
      setIsInferring(false)
      setHasInferred(true)
    }
  }
  
  // Get presets for a specific type, combining defaults with user customs
  const getPresets = (type: string): string[] => {
    const defaults: Record<string, string[]> = {
      activity: ['after workout', 'during commute', 'before bed', 'at work', 'morning routine'],
      mood: ['focused', 'anxious', 'calm', 'energized', 'reflective', 'playful', 'stressed'],
      energy: ['low', 'medium', 'high'],
    }
    
    const userCustoms = userPreferences
      .filter(p => p.preference_type === type)
      .map(p => p.value)
      .sort((a, b) => {
        const aCount = userPreferences.find(p => p.value === a)?.usage_count || 0
        const bCount = userPreferences.find(p => p.value === b)?.usage_count || 0
        return bCount - aCount  // Most used first
      })
    
    // User customs first, then defaults (deduplicated)
    const all = [...userCustoms, ...(defaults[type] || [])]
    return [...new Set(all)]
  }
  
  // Handle field update
  const updateField = (field: keyof EntryEnrichment, value: unknown) => {
    const updated = { ...enrichment, [field]: value }
    setEnrichment(updated)
  }
  
  // Save enrichment
  const saveEnrichment = async () => {
    setIsSaving(true)
    try {
      const updatedMetadata = { ...metadata, enrichment }
      
      const response = await fetch(`/api/entries/${entryId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }
      
      // Track preference usage
      if (enrichment.activity) {
        await trackPreferenceUsage('activity', enrichment.activity)
      }
      if (enrichment.mood) {
        for (const m of enrichment.mood) {
          await trackPreferenceUsage('mood', m)
        }
      }
      if (enrichment.energy) {
        await trackPreferenceUsage('energy', enrichment.energy)
      }
      
      onUpdate(updatedMetadata)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (error) {
      console.error('Failed to save enrichment:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Track when a preference is used (for sorting by frequency)
  const trackPreferenceUsage = async (type: string, value: string) => {
    try {
      await fetch('/api/user-preferences/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, value }),
      })
    } catch (error) {
      console.error('Failed to track preference:', error)
    }
  }
  
  // Add custom value
  const addCustomValue = async (type: string, value: string) => {
    try {
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, value }),
      })
      await loadUserPreferences()
    } catch (error) {
      console.error('Failed to add custom value:', error)
    }
  }
  
  // Handle location name correction
  const correctLocationName = async (newName: string) => {
    if (!metadata.location) return
    
    try {
      // Save the override
      await fetch('/api/user-locations/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lat: metadata.location.lat,
          lng: metadata.location.lng,
          label: newName,
          isArea: true,  // Treat as area override
        }),
      })
      
      // Update this entry's metadata
      const updatedMetadata: EntryMetadata = {
        ...metadata,
        location: {
          ...metadata.location,
          display_name: newName,
        },
        user_overrides: {
          ...metadata.user_overrides,
          location_name: {
            original: metadata.location.raw_name,
            corrected: newName,
            corrected_at: new Date().toISOString(),
          },
        },
      }
      
      await fetch(`/api/entries/${entryId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata }),
      })
      
      onUpdate(updatedMetadata)
    } catch (error) {
      console.error('Failed to correct location:', error)
    }
  }
  
  // Handle location label update
  const updateLocationLabel = async (label: string) => {
    if (!metadata.location) return
    
    try {
      await fetch('/api/user-locations/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lat: metadata.location.lat,
          lng: metadata.location.lng,
          label,
        }),
      })
      
      const updatedMetadata: EntryMetadata = {
        ...metadata,
        location: {
          ...metadata.location,
          label,
        },
      }
      
      await fetch(`/api/entries/${entryId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata }),
      })
      
      onUpdate(updatedMetadata)
    } catch (error) {
      console.error('Failed to update location label:', error)
    }
  }
  
  return (
    <div style={{ borderTop: '1px solid var(--border-subtle, #374151)', marginTop: '16px', paddingTop: '12px' }}>
      {/* Context summary with drag-to-reorder */}
      <ContextSummaryLine
        items={contextItems}
        location={metadata.location?.display_name || metadata.location?.raw_name}
        onReorder={handleContextReorder}
        onClick={() => setIsExpanded(!isExpanded)}
        expanded={isExpanded}
        editable={true}
      />
      
      {/* Expanded view - enrichment fields */}
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          {/* Location (editable) */}
          {metadata.location && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                LOCATION
              </label>
              <EditableField
                value={metadata.location.display_name}
                onSave={correctLocationName}
                placeholder="Location name"
              />
              <div style={{ marginTop: '4px' }}>
                <EditableField
                  value={metadata.location.label || ''}
                  onSave={updateLocationLabel}
                  placeholder="Label (home, work, gym...)"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>
            </div>
          )}
          
          {/* Activity */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
              ACTIVITY
            </label>
            <ChipSelector
              options={getPresets('activity')}
              selected={enrichment.activity ? [enrichment.activity] : []}
              onSelect={(values) => updateField('activity', values[0])}
              allowCustom
              onAddCustom={(value) => addCustomValue('activity', value)}
              singleSelect
            />
          </div>
          
          {/* Energy */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
              ENERGY
            </label>
            <ChipSelector
              options={getPresets('energy')}
              selected={enrichment.energy ? [enrichment.energy] : []}
              onSelect={(values) => updateField('energy', values[0])}
              allowCustom
              onAddCustom={(value) => addCustomValue('energy', value)}
              singleSelect
            />
          </div>
          
          {/* Mood (multi-select) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
              MOOD
            </label>
            <ChipSelector
              options={getPresets('mood')}
              selected={enrichment.mood || []}
              onSelect={(values) => updateField('mood', values)}
              allowCustom
              onAddCustom={(value) => addCustomValue('mood', value)}
            />
          </div>
          
          {/* Environment (free text) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
              ENVIRONMENT
            </label>
            <input
              type="text"
              value={enrichment.environment || ''}
              onChange={(e) => updateField('environment', e.target.value)}
              placeholder="Where were you? What was the setting?"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                color: '#1F2937',
                fontSize: '0.9rem',
              }}
            />
          </div>
          
          {/* Trigger (free text) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
              WHAT TRIGGERED THIS?
            </label>
            <input
              type="text"
              value={enrichment.trigger || ''}
              onChange={(e) => updateField('trigger', e.target.value)}
              placeholder="Conversation, article, thought..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                color: '#1F2937',
                fontSize: '0.9rem',
              }}
            />
          </div>
          
          {/* AI Infer button */}
          {entryContent && (
            <button
              type="button"
              onClick={inferEnrichment}
              disabled={isInferring}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '8px',
                background: isInferring ? '#6B7280' : '#3B82F6',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: isInferring ? 'wait' : 'pointer',
                opacity: isInferring ? 0.7 : 1,
              }}
            >
              {isInferring ? '✨ Analyzing...' : '✨ Auto-fill from Entry'}
            </button>
          )}
          
          {/* Save button */}
          <button
            type="button"
            onClick={saveEnrichment}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '10px',
              background: saveStatus === 'saved' 
                ? '#22C55E' 
                : saveStatus === 'error' 
                  ? '#EF4444' 
                  : '#DC143C',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontWeight: 600,
              cursor: isSaving ? 'wait' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
          >
            {isSaving 
              ? 'Saving...' 
              : saveStatus === 'saved' 
                ? '✓ Saved!' 
                : saveStatus === 'error' 
                  ? '✗ Failed - Try Again' 
                  : 'Save Context'}
          </button>
        </div>
      )}
    </div>
  )
}

