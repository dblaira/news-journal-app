// components/entry/MetadataEnrichment.tsx

'use client'

import { useState, useEffect } from 'react'
import { EntryMetadata, EntryEnrichment, UserPreference } from '@/types/metadata'
import ChipSelector from '@/components/ui/ChipSelector'
import EditableField from '@/components/ui/EditableField'

interface MetadataEnrichmentProps {
  entryId: string
  metadata: EntryMetadata
  onUpdate: (metadata: EntryMetadata) => void
  userId: string
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
}: MetadataEnrichmentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [enrichment, setEnrichment] = useState<EntryEnrichment>(metadata.enrichment || {})
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // Load user's custom presets
  useEffect(() => {
    loadUserPreferences()
  }, [userId])
  
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
      
      await fetch(`/api/entries/${entryId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata }),
      })
      
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
    } catch (error) {
      console.error('Failed to save enrichment:', error)
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
      {/* Collapsed view - always visible */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9CA3AF)' }}>
          {/* Auto-captured summary */}
          {metadata.day_of_week && (
            <span>{metadata.day_of_week.slice(0, 3)}</span>
          )}
          {metadata.captured_at && (
            <span> {formatTime(metadata.captured_at)}</span>
          )}
          {metadata.location && (
            <span> • {metadata.location.display_name}</span>
          )}
          {metadata.location?.label && (
            <span style={{ 
              marginLeft: '6px',
              padding: '2px 6px',
              background: 'var(--bg-panel-alt, #374151)',
              borderRadius: '4px',
              fontSize: '0.7rem',
            }}>
              {metadata.location.label}
            </span>
          )}
          {/* Enrichment summary */}
          {enrichment.activity && <span> • {enrichment.activity}</span>}
          {enrichment.energy && <span> • {enrichment.energy} energy</span>}
        </div>
        <span style={{ color: 'var(--text-muted, #6B7280)', fontSize: '0.8rem' }}>
          {isExpanded ? '▼' : '▶'} Context
        </span>
      </div>
      
      {/* Expanded view - enrichment fields */}
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          {/* Location (editable) */}
          {metadata.location && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6B7280)', display: 'block', marginBottom: '4px' }}>
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
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6B7280)', display: 'block', marginBottom: '4px' }}>
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
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6B7280)', display: 'block', marginBottom: '4px' }}>
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
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6B7280)', display: 'block', marginBottom: '4px' }}>
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
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6B7280)', display: 'block', marginBottom: '4px' }}>
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
                background: 'var(--bg-panel, #1F2937)',
                border: '1px solid var(--border-subtle, #374151)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
              }}
            />
          </div>
          
          {/* Trigger (free text) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6B7280)', display: 'block', marginBottom: '4px' }}>
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
                background: 'var(--bg-panel, #1F2937)',
                border: '1px solid var(--border-subtle, #374151)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
              }}
            />
          </div>
          
          {/* Save button */}
          <button
            type="button"
            onClick={saveEnrichment}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--accent-crimson, #DC143C)',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontWeight: 600,
              cursor: isSaving ? 'wait' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Save Context'}
          </button>
        </div>
      )}
    </div>
  )
}

