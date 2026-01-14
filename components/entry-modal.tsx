'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Entry, Version, MindMap, ReactFlowNode, ReactFlowEdge, EntryMetadata, EntryImage } from '@/types'
import { formatEntryDateLong, stripHtml } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'
import { incrementViewCount, removeEntryPhoto, togglePin, updateEntryContent, updateEntryDetails } from '@/app/actions/entries'
import { getEntryImages } from '@/lib/utils/entry-images'
import { TiptapEditor } from './editor/TiptapEditor'
import { generateMindMap, toReactFlowFormat } from '@/lib/mindmap/utils'
import MetadataEnrichment from './entry/MetadataEnrichment'
import { ImageGallery } from './entry/ImageGallery'

// Dynamic import for MindMapCanvas to avoid SSR issues with ReactFlow
const MindMapCanvas = dynamic(() => import('./mindmap/MindMapCanvas'), { ssr: false })

interface EntryModalProps {
  entry: Entry
  onClose: () => void
  onGenerateVersions: (id: string) => void
  onDeleteEntry: (id: string) => void
  onPhotoUpdated?: (entryId: string, photoUrl: string | null) => void
  onPinToggled?: (entryId: string, isPinned: boolean) => void
  onContentUpdated?: (entryId: string, content: string) => void
  onEntryUpdated?: (entryId: string, updates: Partial<Entry>) => void
}

export function EntryModal({
  entry,
  onClose,
  onGenerateVersions,
  onDeleteEntry,
  onPhotoUpdated,
  onPinToggled,
  onContentUpdated,
  onEntryUpdated,
}: EntryModalProps) {
  const formattedDate = formatEntryDateLong(entry.created_at)
  const hasVersions = Array.isArray(entry.versions) && entry.versions.length > 0
  const isGenerating = entry.generating_versions
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false)
  // Prefer image_url (from multimodal capture) over photo_url
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(entry.image_url || entry.photo_url)
  const [isPinned, setIsPinned] = useState(!!entry.pinned_at)
  const [isTogglingPin, setIsTogglingPin] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Multi-image gallery state
  const [entryImages, setEntryImages] = useState<EntryImage[]>(() => getEntryImages(entry))
  
  // Edit mode state
  const [isEditing, setIsEditingInternal] = useState(false)
  const [editedContent, setEditedContent] = useState(entry.content)
  const [editedHeadline, setEditedHeadline] = useState(entry.headline)
  const [editedSubheading, setEditedSubheading] = useState(entry.subheading || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Cursor position tracking for textarea
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [savedCursorPosition, setSavedCursorPosition] = useState<number | null>(null)
  
  // Track previous entry ID to detect actual entry changes
  const prevEntryIdRef = useRef(entry.id)
  
  // Track if we're intentionally exiting edit mode (to prevent accidental exits)
  const isIntentionallyExitingRef = useRef(false)
  
  // Track edit state in ref for use in effects (avoids stale closures)
  const isEditingRef = useRef(false)
  
  // DEBUG: Track all state changes
  const [debugLog, setDebugLog] = useState<Array<{time: string, action: string, isEditing: boolean, source: string}>>([])

  // Helper to save debug logs to localStorage for later retrieval
  const saveDebugToStorage = (logEntry: {location: string, message: string, data: any}) => {
    try {
      const existing = JSON.parse(localStorage.getItem('debug_logs') || '[]')
      existing.push({...logEntry, timestamp: Date.now()})
      // Keep last 100 entries
      localStorage.setItem('debug_logs', JSON.stringify(existing.slice(-100)))
    } catch (e) { /* ignore */ }
  }

  // Wrapper to log all setIsEditingInternal calls (for debugging)
  const setIsEditingWithLog = (value: boolean, source: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = { time: timestamp, action: value ? 'ENTER_EDIT' : 'EXIT_EDIT', isEditing: value, source }
    console.log(`[EDIT MODE] ${logEntry.action} from: ${source}`)
    setDebugLog(prev => [...prev.slice(-9), logEntry]) // Keep last 10 entries
    isEditingRef.current = value // Update ref immediately
    setIsEditingInternal(value)
    // Save to localStorage for debugging (accessible via ?debug=true)
    saveDebugToStorage({location:'entry-modal.tsx:setIsEditingWithLog',message:`EDIT_STATE_CHANGE: ${value ? 'ENTER' : 'EXIT'}`,data:{newValue:value,source,isIntentionallyExiting:isIntentionallyExitingRef.current,timestamp}})
  }
  
  // Edit mode is "sticky" - once entered, it can only be exited via explicit user action
  // This prevents accidental exits on mobile from touch events, blur, etc.

  // Mind map state
  const [showMindMap, setShowMindMap] = useState(false)
  const [mindMapData, setMindMapData] = useState<{ nodes: ReactFlowNode[]; edges: ReactFlowEdge[]; title: string } | null>(null)
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false)
  
  // Metadata state (for enrichment updates)
  const [currentMetadata, setCurrentMetadata] = useState(entry.metadata as EntryMetadata | undefined)

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Mobile detection for responsive button layout
  const [isMobile, setIsMobile] = useState(false)
  
  // Debug mode - only show panel when ?debug=true is in URL
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  
  useEffect(() => {
    // Check URL for debug parameter
    const urlParams = new URLSearchParams(window.location.search)
    setShowDebugPanel(urlParams.get('debug') === 'true')
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track view when modal opens
  useEffect(() => {
    incrementViewCount(entry.id)
      .then((result) => {
        if (result.error) {
          console.error('Failed to increment view count:', result.error)
        }
      })
      .catch((error) => {
        console.error('Failed to increment view count:', error)
      })
  }, [entry.id])

  // Update local photo URL when entry changes (prefer image_url from multimodal capture)
  useEffect(() => {
    setCurrentPhotoUrl(entry.image_url || entry.photo_url)
  }, [entry.image_url, entry.photo_url])

  // Update pin state when entry changes
  useEffect(() => {
    setIsPinned(!!entry.pinned_at)
  }, [entry.pinned_at])

  // Update images when entry changes
  useEffect(() => {
    setEntryImages(getEntryImages(entry))
  }, [entry.images, entry.image_url, entry.photo_url])

  // Handle entry changes - ONLY reset if entry ID changed (different entry)
  // CRITICAL: While editing, completely ignore all prop updates (including auto-save)
  useEffect(() => {
    const currentEntryId = entry.id
    const currentIsEditing = isEditingRef.current // Use ref for current value (always up-to-date)
    
    // Only process if entry ID actually changed
    if (prevEntryIdRef.current !== currentEntryId) {
      // Different entry - reset everything
      console.log('[EDIT MODE] Entry ID changed, resetting edit mode')
      isIntentionallyExitingRef.current = true // Allow exit for different entry
      setEditedContent(entry.content)
      setEditedHeadline(entry.headline)
      setEditedSubheading(entry.subheading || '')
      setIsEditingWithLog(false, 'useEffect-entryIdChanged')
      setSavedCursorPosition(null)
      prevEntryIdRef.current = currentEntryId
      setTimeout(() => {
        isIntentionallyExitingRef.current = false
      }, 100)
    } else {
      // Same entry ID - IGNORE all prop updates while editing
      if (currentIsEditing) {
        // Do nothing - user's edits take precedence
        return
      }
      
      // Not editing - sync with prop changes only if not intentionally exiting
      if (!isIntentionallyExitingRef.current) {
        // Only sync if content actually changed (not just object reference)
        const contentChanged = editedContent !== entry.content
        const headlineChanged = editedHeadline !== entry.headline
        const subheadingChanged = editedSubheading !== (entry.subheading || '')
        
        if (contentChanged || headlineChanged || subheadingChanged) {
          setEditedContent(entry.content)
          setEditedHeadline(entry.headline)
          setEditedSubheading(entry.subheading || '')
        }
      }
    }
  }, [entry.id, entry.content, entry.headline, entry.subheading])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  // Handle export
  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx' | 'docx') => {
    setIsExporting(true)
    setShowExportMenu(false)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          entryIds: [entry.id],
          title: entry.headline || 'Entry Export',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().split('T')[0]
      a.download = `${entry.headline || 'entry'}-${timestamp}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle image export (social card or full entry)
  const handleImageExport = async (mode: 'card' | 'full') => {
    setIsExporting(true)
    setShowExportMenu(false)
    try {
      const response = await fetch(`/api/export-image?entryId=${entry.id}&mode=${mode}&format=png`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Image export failed')
      }

      // Download the image
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = mode === 'card' 
        ? `${entry.headline || 'entry'}-social-card-${timestamp}.png`
        : `${entry.headline || 'entry'}-full-${timestamp}.png`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Image export error:', error)
      alert(error instanceof Error ? error.message : 'Image export failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle auto-save content (from TiptapEditor)
  // This saves to DB but does NOT update parent state to avoid re-render issues
  const handleAutoSaveContent = async (content: string) => {
    // Don't show saving indicator for auto-save to avoid UI flicker
    try {
      const result = await updateEntryContent(entry.id, content)
      if (result.error) {
        console.error('Auto-save failed:', result.error)
        // Don't alert for auto-save failures - just log
      } else {
        setLastSaved(new Date())
        // NOTE: Intentionally NOT calling onContentUpdated here
        // Parent state will be updated on manual save or modal close
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  // Handle save all changes (headline, subheading, content)
  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      // Check if headline or subheading changed
      const headlineChanged = editedHeadline !== entry.headline
      const subheadingChanged = editedSubheading !== (entry.subheading || '')
      const contentChanged = editedContent !== entry.content

      // Save headline/subheading if changed
      if (headlineChanged || subheadingChanged) {
        const detailsResult = await updateEntryDetails(entry.id, {
          headline: editedHeadline,
          subheading: editedSubheading || undefined,
        })
        if (detailsResult.error) {
          console.error('Failed to save details:', detailsResult.error)
          alert('Failed to save headline/subheading. Please try again.')
          return
        }
        // Notify parent of updates
        onEntryUpdated?.(entry.id, {
          headline: editedHeadline,
          subheading: editedSubheading || undefined,
        })
      }

      // Save content if changed
      if (contentChanged) {
        const contentResult = await updateEntryContent(entry.id, editedContent)
        if (contentResult.error) {
          console.error('Failed to save content:', contentResult.error)
          alert('Failed to save content. Please try again.')
          return
        }
        onContentUpdated?.(entry.id, editedContent)
      }

      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel editing
  const handleCancelEdit = () => {
    isIntentionallyExitingRef.current = true
    setEditedContent(entry.content)
    setEditedHeadline(entry.headline)
    setEditedSubheading(entry.subheading || '')
    setIsEditingWithLog(false, 'handleCancelEdit')
    setSavedCursorPosition(null)
    // Reset flag after state update
    setTimeout(() => {
      isIntentionallyExitingRef.current = false
    }, 100)
  }
  
  // Handle entering edit mode - preserve cursor position if available
  const handleEnterEditMode = () => {
    isIntentionallyExitingRef.current = false
    setIsEditingWithLog(true, 'handleEnterEditMode')
    // Restore cursor position after a brief delay to ensure textarea is rendered
    setTimeout(() => {
      if (contentTextareaRef.current && savedCursorPosition !== null) {
        contentTextareaRef.current.focus()
        contentTextareaRef.current.setSelectionRange(savedCursorPosition, savedCursorPosition)
      } else if (contentTextareaRef.current) {
        // If no saved position, focus at the end
        contentTextareaRef.current.focus()
        const length = contentTextareaRef.current.value.length
        contentTextareaRef.current.setSelectionRange(length, length)
      }
    }, 50)
  }
  
  // Save cursor position when exiting edit mode
  const handleExitEditMode = () => {
    isIntentionallyExitingRef.current = true
    if (contentTextareaRef.current) {
      const cursorPos = contentTextareaRef.current.selectionStart
      setSavedCursorPosition(cursorPos)
    }
    setIsEditingWithLog(false, 'handleExitEditMode')
    // Reset flag after state update
    setTimeout(() => {
      isIntentionallyExitingRef.current = false
    }, 100)
  }

  // Handle mind map generation
  const handleGenerateMindMap = async () => {
    setIsGeneratingMindMap(true)
    try {
      // Strip HTML from content for cleaner LLM processing
      const plainText = stripHtml(entry.content)
      const textWithContext = `Title: ${entry.headline}\n${entry.subheading ? `Subtitle: ${entry.subheading}\n` : ''}Category: ${entry.category}\n\n${plainText}`
      
      const mindMap = await generateMindMap(textWithContext, entry.id)
      const { nodes, edges } = toReactFlowFormat(mindMap)
      
      setMindMapData({ nodes, edges, title: mindMap.title })
      setShowMindMap(true)
    } catch (error) {
      console.error('Failed to generate mind map:', error)
      alert('Failed to generate mind map. Please try again.')
    } finally {
      setIsGeneratingMindMap(false)
    }
  }

  // Handle manual save and exit edit mode
  const handleSaveAndClose = async () => {
    await handleSaveAll()
    handleExitEditMode()
  }

  const handleTogglePin = async () => {
    setIsTogglingPin(true)
    const previousPinState = isPinned
    
    // Optimistic update
    setIsPinned(!isPinned)
    
    try {
      const result = await togglePin(entry.id)
      if (result.error) {
        // Revert on error
        setIsPinned(previousPinState)
        alert(result.error)
      } else {
        // Notify parent of pin change
        onPinToggled?.(entry.id, result.pinned ?? !previousPinState)
      }
    } catch (error) {
      // Revert on error
      setIsPinned(previousPinState)
      console.error('Failed to toggle pin:', error)
      alert('Failed to toggle pin. Please try again.')
    } finally {
      setIsTogglingPin(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entryId', entry.id)

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }

      const data = await response.json()
      setCurrentPhotoUrl(data.photoUrl)
      onPhotoUpdated?.(entry.id, data.photoUrl)
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      alert(`Failed to upload photo: ${error.message || 'Unknown error'}`)
    } finally {
      setIsUploadingPhoto(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove this photo?')) return

    setIsRemovingPhoto(true)
    try {
      const result = await removeEntryPhoto(entry.id)
      if (result.error) {
        throw new Error(result.error)
      }
      setCurrentPhotoUrl(undefined)
      onPhotoUpdated?.(entry.id, null)
    } catch (error: any) {
      console.error('Error removing photo:', error)
      alert(`Failed to remove photo: ${error.message || 'Unknown error'}`)
    } finally {
      setIsRemovingPhoto(false)
    }
  }

  return (
    <div
      className="modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: isMobile ? '0.5rem' : '2rem',
        overflowY: 'auto',
        pointerEvents: isEditing ? 'auto' : 'auto', // Allow interactions when editing
      }}
      onClick={(e) => {
        // NEVER close modal if editing - this prevents accidental exits on mobile
        if (isEditing) {
          e.stopPropagation()
          e.preventDefault()
          return
        }
        // Only close if clicking the background (not modal content) and not editing
        if (e.target === e.currentTarget && !isIntentionallyExitingRef.current) {
          onClose()
        }
      }}
      onTouchStart={(e) => {
        // Prevent any touch events on background from closing if editing
        if (isEditing) {
          e.stopPropagation()
        }
      }}
      onTouchEnd={(e) => {
        // Prevent touch end from closing if editing
        if (isEditing) {
          e.stopPropagation()
        }
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          marginTop: isMobile ? '0.5rem' : '2rem',
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '3rem',
          position: 'relative',
          borderRadius: 0,
        }}
        onClick={(e) => {
          // Prevent modal close when clicking inside modal content
          e.stopPropagation()
          if (isEditing) {
            e.preventDefault()
          }
        }}
        onTouchStart={(e) => {
          // Prevent touch events from bubbling when editing
          if (isEditing) {
            e.stopPropagation()
          }
        }}
      >
        {/* DEBUG PANEL - Only visible when ?debug=true in URL */}
        {showDebugPanel && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: isEditing ? '#22C55E' : '#DC143C',
            color: '#fff',
            padding: '0.5rem',
            fontSize: '0.7rem',
            zIndex: 9999,
            fontFamily: 'monospace',
            maxHeight: '180px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>DEBUG: isEditing={isEditing ? 'TRUE' : 'FALSE'}</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => {
                    localStorage.removeItem('debug_logs')
                    alert('Logs cleared!')
                  }}
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '2px 6px', fontSize: '0.6rem', borderRadius: '3px' }}
                >
                  🗑️ Clear
                </button>
                <button 
                  onClick={() => {
                    const logs = localStorage.getItem('debug_logs') || '[]'
                    navigator.clipboard.writeText(logs).then(() => alert('Logs copied!')).catch(() => alert('Copy failed'))
                  }}
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '2px 6px', fontSize: '0.6rem', borderRadius: '3px' }}
                >
                  📋 Copy Logs
                </button>
              </div>
            </div>
            <div style={{ marginTop: '0.25rem', fontSize: '0.65rem' }}>
              {debugLog.slice(-5).map((log, i) => (
                <div key={i}>{log.time} - {log.action} from {log.source}</div>
              ))}
            </div>
          </div>
        )}
        {/* Close button - separate on mobile for cleaner UX */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: isMobile ? '0.75rem' : '1.5rem',
            right: isMobile ? '0.75rem' : '1.5rem',
            background: 'transparent',
            color: '#666666',
            border: 'none',
            padding: isMobile ? '0.5rem' : '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: isMobile ? '1.5rem' : '0.85rem',
            borderRadius: isMobile ? '50%' : 0,
            fontWeight: 600,
            letterSpacing: '0.05rem',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
            zIndex: 20,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#DC143C'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#666666'
          }}
        >
          {isMobile ? '✕' : 'Close'}
        </button>

        {/* Action buttons */}
        <div style={{
          position: 'absolute',
          top: isMobile ? '0.75rem' : '1.5rem',
          left: isMobile ? '0.75rem' : 'auto',
          right: isMobile ? 'auto' : '6rem',
          display: 'flex',
          gap: isMobile ? '0.25rem' : '0.5rem',
          zIndex: 10,
        }}>
          {isEditing ? (
            <>
              {/* Save button */}
              <button
                onClick={async () => {
                  await handleSaveAll()
                  handleExitEditMode()
                }}
                disabled={isSaving}
                aria-label="Save"
                title="Save"
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: '1px solid #2563EB',
                  padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '1rem' : '0.85rem',
                  borderRadius: 0,
                  fontWeight: 600,
                  letterSpacing: '0.05rem',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  opacity: isSaving ? 0.7 : 1,
                  minWidth: isMobile ? '36px' : 'auto',
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.background = '#1D4ED8'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563EB'
                }}
              >
                {isMobile ? '✓' : (isSaving ? 'Saving...' : 'Save')}
              </button>
              {/* Cancel button */}
              <button
                onClick={handleCancelEdit}
                aria-label="Cancel"
                title="Cancel"
                style={{
                  background: 'transparent',
                  color: '#666666',
                  border: '1px solid #666666',
                  padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: isMobile ? '1rem' : '0.85rem',
                  borderRadius: 0,
                  fontWeight: 600,
                  letterSpacing: '0.05rem',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  minWidth: isMobile ? '36px' : 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#666666'
                  e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#666666'
                }}
              >
                {isMobile ? '✗' : 'Cancel'}
              </button>
            </>
          ) : (
            /* Edit button */
            <button
              onClick={handleEnterEditMode}
              aria-label="Edit"
              title="Edit"
              style={{
                background: 'transparent',
                color: '#2563EB',
                border: '1px solid #2563EB',
                padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: isMobile ? '1rem' : '0.85rem',
                borderRadius: 0,
                fontWeight: 600,
                letterSpacing: '0.05rem',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
                minWidth: isMobile ? '36px' : 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563EB'
                e.currentTarget.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#2563EB'
              }}
            >
              {isMobile ? '✎' : 'Edit'}
            </button>
          )}
          
          {/* Separator on mobile */}
          {isMobile && (
            <div style={{ width: '1px', background: 'rgba(0,0,0,0.15)', margin: '0 0.25rem' }} />
          )}
          
          {/* Pin button */}
          <button
            onClick={handleTogglePin}
            disabled={isTogglingPin}
            aria-label={isPinned ? 'Unpin' : 'Pin'}
            title={isPinned ? 'Unpin' : 'Pin'}
            style={{
              background: isPinned ? '#228B22' : 'transparent',
              color: isPinned ? '#FFFFFF' : '#228B22',
              border: '1px solid #228B22',
              padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem',
              cursor: isTogglingPin ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '1rem' : '0.85rem',
              borderRadius: 0,
              fontWeight: 600,
              letterSpacing: '0.05rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              opacity: isTogglingPin ? 0.6 : 1,
              minWidth: isMobile ? '36px' : 'auto',
            }}
            onMouseEnter={(e) => {
              if (!isTogglingPin) {
                e.currentTarget.style.background = '#228B22'
                e.currentTarget.style.color = '#FFFFFF'
              }
            }}
            onMouseLeave={(e) => {
              if (!isTogglingPin) {
                e.currentTarget.style.background = isPinned ? '#228B22' : 'transparent'
                e.currentTarget.style.color = isPinned ? '#FFFFFF' : '#228B22'
              }
            }}
          >
            {isMobile ? (isTogglingPin ? '…' : (isPinned ? '◉' : '○')) : (isTogglingPin ? '...' : isPinned ? 'Unpin' : 'Pin')}
          </button>
          
          {/* Export button with dropdown */}
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              aria-label="Export"
              title="Export entry"
              style={{
                background: 'transparent',
                color: '#6366F1',
                border: '1px solid #6366F1',
                padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '1rem' : '0.85rem',
                borderRadius: 0,
                fontWeight: 600,
                letterSpacing: '0.05rem',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
                opacity: isExporting ? 0.6 : 1,
                minWidth: isMobile ? '36px' : 'auto',
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = '#6366F1'
                  e.currentTarget.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6366F1'
                }
              }}
            >
              {isMobile ? (isExporting ? '…' : '↓') : (isExporting ? 'Exporting...' : 'Export ▾')}
            </button>
            
            {/* Export dropdown menu */}
            {showExportMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.25rem',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: '180px',
                  overflow: 'hidden',
                }}
              >
                {/* Document export options */}
                {[
                  { format: 'pdf' as const, label: 'PDF', icon: '📄' },
                  { format: 'docx' as const, label: 'Word', icon: '📝' },
                  { format: 'xlsx' as const, label: 'Excel', icon: '📊' },
                  { format: 'csv' as const, label: 'CSV', icon: '📋' },
                ].map(({ format, label, icon }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #F3F4F6',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F3F4F6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
                
                {/* Separator */}
                <div style={{ 
                  padding: '0.4rem 1rem', 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: '#F9FAFB',
                  borderBottom: '1px solid #F3F4F6',
                }}>
                  Images
                </div>
                
                {/* Image export options */}
                <button
                  onClick={() => handleImageExport('card')}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #F3F4F6',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>🖼️</span>
                  <span>Social Card</span>
                </button>
                <button
                  onClick={() => handleImageExport('full')}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>📸</span>
                  <span>Full Entry</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Delete button */}
          <button
            onClick={() => onDeleteEntry(entry.id)}
            aria-label="Delete"
            title="Delete"
            style={{
              background: 'transparent',
              color: '#DC143C',
              border: '1px solid #DC143C',
              padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: isMobile ? '1rem' : '0.85rem',
              borderRadius: 0,
              fontWeight: 600,
              letterSpacing: '0.05rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              minWidth: isMobile ? '36px' : 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#DC143C'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#DC143C'
            }}
          >
            {isMobile ? '🗑' : 'Delete'}
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1rem',
              color: '#DC143C',
            }}
          >
            {entry.category}
          </span>
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editedHeadline}
            onChange={(e) => setEditedHeadline(e.target.value)}
            placeholder="Enter headline..."
            style={{
              width: '100%',
              fontSize: '2.8rem',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              lineHeight: 1.15,
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
              color: '#000000',
              background: '#F3F4F6',
              border: '2px solid #2563EB',
              borderRadius: '4px',
              padding: '0.5rem',
              outline: 'none',
            }}
          />
        ) : (
          <h2
            style={{
              fontSize: '2.8rem',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              lineHeight: 1.15,
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
              color: '#000000',
            }}
          >
            {entry.headline}
          </h2>
        )}

        {isEditing ? (
          <input
            type="text"
            value={editedSubheading}
            onChange={(e) => setEditedSubheading(e.target.value)}
            placeholder="Add a subheading (optional)..."
            style={{
              width: '100%',
              fontSize: '1.2rem',
              color: '#666',
              fontStyle: 'italic',
              marginBottom: '1.5rem',
              background: '#F3F4F6',
              border: '2px solid #2563EB',
              borderRadius: '4px',
              padding: '0.5rem',
              outline: 'none',
            }}
          />
        ) : (
          entry.subheading && (
            <p
              style={{
                fontSize: '1.2rem',
                color: '#666',
                fontStyle: 'italic',
                marginBottom: '1.5rem',
              }}
            >
              {entry.subheading}
            </p>
          )
        )}

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />

        {/* Image Gallery Section */}
        {entryImages.length > 0 ? (
          <ImageGallery
            images={entryImages}
            entryId={entry.id}
            onImagesUpdated={(updatedImages) => {
              setEntryImages(updatedImages)
              onEntryUpdated?.(entry.id, { images: updatedImages })
            }}
            editable={true}
          />
        ) : (
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              style={{
                width: '100%',
                padding: '2rem',
                background: '#f8f9fb',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                color: '#666',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                opacity: isUploadingPhoto ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isUploadingPhoto) {
                  e.currentTarget.style.borderColor = '#DC143C'
                  e.currentTarget.style.color = '#DC143C'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.color = '#666'
              }}
            >
              {isUploadingPhoto ? 'Uploading...' : '📷 Click to Add Photo'}
            </button>
          </div>
        )}
        
        {/* Display AI-extracted data from first image (for backward compatibility) */}
        {entry.image_extracted_data && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              background: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #bae6fd',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              🤖 AI Detected: {entry.image_extracted_data.imageType}
            </div>
            
            {/* Context-aware structure: userConnectionAnalysis */}
            {entry.image_extracted_data.userConnectionAnalysis && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                  {entry.image_extracted_data.userConnectionAnalysis.whatTheyNoticedAbout}
                </div>
                {entry.image_extracted_data.userConnectionAnalysis.keyElements?.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    Key elements: {entry.image_extracted_data.userConnectionAnalysis.keyElements.join(' • ')}
                  </div>
                )}
              </div>
            )}

            {/* Purchase data */}
            {entry.image_extracted_data.purchase?.detected && entry.image_extracted_data.purchase.productName && (
              <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                <strong>{entry.image_extracted_data.purchase.productName}</strong>
                {entry.image_extracted_data.purchase.price && (
                  <span style={{ color: '#6B7280' }}> • ${entry.image_extracted_data.purchase.price}</span>
                )}
                {entry.image_extracted_data.purchase.seller && (
                  <span style={{ color: '#6B7280' }}> • {entry.image_extracted_data.purchase.seller}</span>
                )}
              </div>
            )}

            {/* Tags */}
            {entry.image_extracted_data.suggestedTags && entry.image_extracted_data.suggestedTags.length > 0 && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {entry.image_extracted_data.suggestedTags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      fontSize: '0.7rem',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            fontSize: '0.9rem',
            color: '#666',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #ddd',
          }}
        >
          <div>{formattedDate}</div>
          {entry.mood && (
            <div style={{ marginTop: '0.5rem' }}>Mood: {entry.mood}</div>
          )}
          
          {/* Metadata Context Panel */}
          {currentMetadata && (
            <MetadataEnrichment
              entryId={entry.id}
              metadata={currentMetadata}
              onUpdate={(updatedMetadata) => {
                // Update local state to reflect saved changes
                setCurrentMetadata(updatedMetadata)
              }}
              userId={entry.user_id}
              entryContent={entry.content}
            />
          )}
        </div>

        {/* Original Entry */}
        <div
          style={{
            background: isEditing ? '#1a1a2e' : '#f8f9fb',
            border: isEditing ? '1px solid #374151' : '1px solid #dfe3ef',
            padding: isMobile ? '1rem' : '2rem',
            borderRadius: '12px',
            marginBottom: '2.5rem',
            transition: 'all 0.2s ease',
          }}
          onClick={(e) => {
            // Prevent clicks inside this div from bubbling to modal
            e.stopPropagation()
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.2rem',
          }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: isEditing ? '#E5E7EB' : '#1c1f2e',
                margin: 0,
              }}
            >
              {isEditing ? '✏️ Editing Entry' : '📝 Your Original Entry'}
            </h3>
            {isEditing && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {lastSaved && (
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {isSaving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
                  </span>
                )}
                <button
                  onClick={handleCancelEdit}
                  type="button"
                  style={{
                    background: 'transparent',
                    color: '#9CA3AF',
                    border: '1px solid #4B5563',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAndClose}
                  type="button"
                  disabled={isSaving}
                  style={{
                    background: '#22C55E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save & Close'}
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <textarea
              ref={contentTextareaRef}
              value={editedContent}
              onChange={(e) => {
                setEditedContent(e.target.value)
                // Save cursor position on change
                // Use requestAnimationFrame to ensure selectionStart is accurate
                requestAnimationFrame(() => {
                  if (contentTextareaRef.current) {
                    setSavedCursorPosition(contentTextareaRef.current.selectionStart)
                  }
                })
              }}
              onBlur={(e) => {
                // Save cursor position when losing focus
                // BUT don't exit edit mode on blur - user might just be scrolling on mobile
                setSavedCursorPosition(e.target.selectionStart)
                // Keep edit mode active even on blur - this prevents mobile keyboard issues
              }}
              onFocus={(e) => {
                // Restore cursor position when gaining focus
                if (savedCursorPosition !== null) {
                  setTimeout(() => {
                    e.target.setSelectionRange(savedCursorPosition, savedCursorPosition)
                  }, 0)
                }
              }}
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '1rem',
                fontSize: '1rem',
                lineHeight: 1.6,
                border: '1px solid #374151',
                borderRadius: '8px',
                background: '#1a1a2e',
                color: '#fff',
                resize: 'vertical',
              }}
            />
          ) : (
            <div
              className="rendered-content"
              onClick={handleEnterEditMode}
              style={{
                fontSize: '1rem',
                lineHeight: 1.85,
                color: '#1f2333',
                cursor: 'pointer',
              }}
              title="Click to edit"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          )}
        </div>

        {/* Versions Section */}
        {isGenerating ? (
          <div
            style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: isMobile ? '1rem' : '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#856404',
              margin: '2rem 0',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Generating AI Versions...</h3>
            <p style={{ margin: 0 }}>
              This takes about 10-15 seconds. The page will update when ready.
            </p>
          </div>
        ) : hasVersions ? (
          <div style={{ marginTop: '2rem' }}>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '2rem',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              ✨ AI Generated Versions ✨
            </h3>

            {entry.versions!.map((version: Version) => {
              // Literary/Personal Essay Style
              if (version.name === 'literary') {
                return (
                  <div
                    key={version.name}
                    style={{
                      maxWidth: isMobile ? '100%' : '650px',
                      margin: '0 auto 2rem',
                      padding: isMobile ? '1.5rem 1rem' : '2rem 3rem',
                      background: '#FAF9F6',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                      minHeight: isMobile ? '300px' : '400px',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '1.5rem',
                        color: '#8B4513',
                        textAlign: 'center',
                      }}
                    >
                      {version.title}
                    </h4>
                    <div
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: '1.25rem',
                        lineHeight: 1.8,
                        color: '#2c2c2c',
                        textAlign: 'justify',
                      }}
                    >
                      {/* Drop cap for first letter */}
                      <span
                        style={{
                          float: 'left',
                          fontSize: '3.5em',
                          fontWeight: 'bold',
                          lineHeight: 0.8,
                          paddingRight: '8px',
                          color: '#8b0000',
                        }}
                      >
                        {version.content.charAt(0)}
                      </span>
                      <span style={{ whiteSpace: 'pre-wrap' }}>
                        {version.content.slice(1)}
                      </span>
                    </div>
                    {/* Decorative separator */}
                    <div
                      style={{
                        marginTop: '3rem',
                        textAlign: 'center',
                        color: '#9CA3AF',
                        fontSize: '1.5rem',
                      }}
                    >
                      ❦
                    </div>
                  </div>
                )
              }

              // News Feature Style
              if (version.name === 'news') {
                // Use structured headline/body if available
                // Fallback to splitting only if content looks like prose (not JSON/error)
                const contentLooksLikeJson = version.content.trim().startsWith('{') || version.content.trim().startsWith('[')
                const newsHeadline = version.headline || (contentLooksLikeJson ? 'News Feature' : version.content.split('\n')[0])
                const newsBody = version.body || (contentLooksLikeJson ? version.content : version.content.split('\n').slice(1).join('\n'))
                
                return (
                  <div
                    key={version.name}
                    style={{
                      maxWidth: isMobile ? '100%' : '56rem',
                      margin: '0 auto 2rem',
                      background: '#F1F1F1',
                      color: '#000000',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      overflow: 'hidden',
                      minHeight: isMobile ? '300px' : '400px',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem 3rem' }}>
                      <h4
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          marginBottom: '1rem',
                          color: '#6B7280',
                          textAlign: 'center',
                        }}
                      >
                        {version.title}
                      </h4>
                      {/* Double border headline */}
                      <div
                        style={{
                          borderBottom: '3px double #000000',
                          paddingBottom: '1.5rem',
                          marginBottom: '1.5rem',
                        }}
                      >
                        <h1
                          style={{
                            fontFamily: "'Playfair Display', 'Times New Roman', serif",
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            textAlign: 'center',
                          }}
                        >
                          {newsHeadline}
                        </h1>
                      </div>

                      {/* Article body with dateline */}
                      <div
                        style={{
                          fontFamily: "'Georgia', 'Times New Roman', serif",
                          textAlign: isMobile ? 'left' : 'justify',
                          lineHeight: 1.6,
                          columnCount: isMobile ? 1 : 2,
                          columnGap: '2rem',
                        }}
                      >
                        <p style={{ marginBottom: '1rem' }}>
                          <span
                            style={{
                              fontFamily: "'Helvetica Neue', Arial, sans-serif",
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              marginRight: '0.5rem',
                              color: '#4B5563',
                            }}
                          >
                            SPECIAL REPORT —
                          </span>
                          <span style={{ whiteSpace: 'pre-wrap' }}>{newsBody}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }

              // Poetic Style
              if (version.name === 'poetic') {
                return (
                  <div
                    key={version.name}
                    style={{
                      maxWidth: isMobile ? '100%' : '40rem',
                      margin: '0 auto 2rem',
                      padding: isMobile ? '2rem 1rem' : '3rem 4rem',
                      background: '#f4ebd0',
                      boxShadow: 'inset 0 0 80px rgba(139, 69, 19, 0.15), 0 10px 30px rgba(0,0,0,0.1)',
                      borderRadius: '2px',
                      minHeight: isMobile ? '250px' : '400px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        marginBottom: '2rem',
                        color: '#8B7355',
                      }}
                    >
                      {version.title}
                    </h4>
                    <div
                      style={{
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        fontStyle: 'italic',
                        fontSize: '1.25rem',
                        color: '#5c4b37',
                        textAlign: 'center',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 2,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {version.content}
                    </div>
                  </div>
                )
              }

              // Fallback for unknown styles
              return (
                <div
                  key={version.name}
                  style={{
                    background: '#f0f9f1',
                    padding: isMobile ? '1rem' : '2rem',
                    borderRadius: '8px',
                    marginBottom: '2rem',
                    borderLeft: '4px solid #4CAF50',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '1rem',
                      color: '#2e7d32',
                    }}
                  >
                    {version.title}
                  </h4>
                  <div
                    style={{
                      fontSize: '1rem',
                      lineHeight: 1.8,
                      color: '#1b5e20',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {version.content}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              background: '#e3f2fd',
              border: '1px solid #2196F3',
              padding: isMobile ? '1rem' : '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#0d47a1',
              margin: '2rem 0',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
            <h3 style={{ margin: '0 0 1rem 0' }}>Generate AI Versions</h3>
            <p style={{ margin: '0 0 1.5rem 0' }}>
              See your journal entry rewritten in 3 different styles by AI.
            </p>
            <button
              onClick={() => {
                onClose()
                onGenerateVersions(entry.id)
              }}
              style={{
                background: '#DC143C',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.8rem 1.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08rem',
                textTransform: 'uppercase',
                borderRadius: 0,
                cursor: 'pointer',
                marginRight: '1rem',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#B01030'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#DC143C'
              }}
            >
              ✨ Generate Versions Now
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/export-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'entry', entryIds: [entry.id] }),
                  })
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `entry-${entry.id}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } else {
                    alert('Failed to export PDF')
                  }
                } catch (error) {
                  console.error('Error exporting PDF:', error)
                  alert('Failed to export PDF')
                }
              }}
              style={{
                background: 'transparent',
                color: '#000000',
                border: '1px solid rgba(0,0,0,0.2)',
                padding: '0.8rem 1.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08rem',
                textTransform: 'uppercase',
                borderRadius: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#DC143C'
                e.currentTarget.style.color = '#FFFFFF'
                e.currentTarget.style.borderColor = '#DC143C'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#000000'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'
              }}
            >
              📄 Export PDF
            </button>
            <button
              onClick={handleGenerateMindMap}
              disabled={isGeneratingMindMap}
              style={{
                background: 'transparent',
                color: '#6B21A8',
                border: '1px solid #6B21A8',
                padding: '0.8rem 1.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08rem',
                textTransform: 'uppercase',
                borderRadius: 0,
                cursor: isGeneratingMindMap ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isGeneratingMindMap ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingMindMap) {
                  e.currentTarget.style.background = '#6B21A8'
                  e.currentTarget.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#6B21A8'
              }}
            >
              {isGeneratingMindMap ? '🧠 Generating...' : '🧠 Mind Map'}
            </button>
          </div>
        )}
      </div>

      {/* Mind Map Modal */}
      {showMindMap && mindMapData && (
        <MindMapCanvas
          initialNodes={mindMapData.nodes}
          initialEdges={mindMapData.edges}
          title={mindMapData.title}
          onClose={() => setShowMindMap(false)}
        />
      )}
    </div>
  )
}

