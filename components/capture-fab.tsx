'use client'

import { useState } from 'react'
import { CaptureInput } from './capture-input'
import { CaptureConfirmation } from './capture-confirmation'
import { Entry, EntryType, ImageExtraction, EntryMetadata, EntryImage, SurfaceConditions, ConnectionType } from '@/types'

interface InferredData {
  headline: string
  subheading: string
  category: Entry['category']
  mood: string
  content: string
  entry_type: EntryType
  due_date: string | null
  connection_type?: string | null
  // Multimodal fields (legacy single image)
  image_url?: string
  image_extracted_data?: ImageExtraction
  // Multi-image gallery (new)
  images?: EntryImage[]
  // Metadata fields
  metadata?: EntryMetadata
}

interface CaptureFABProps {
  onEntryCreated: () => void
  userId?: string
}

type CaptureState = 'closed' | 'capturing' | 'confirming'

export function CaptureFAB({ onEntryCreated, userId }: CaptureFABProps) {
  const [state, setState] = useState<CaptureState>('closed')
  const [inferredData, setInferredData] = useState<InferredData | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  const handleOpen = () => {
    setState('capturing')
  }

  const handleClose = () => {
    setState('closed')
    setInferredData(null)
  }

  const handleCapture = (data: InferredData) => {
    setInferredData(data)
    setState('confirming')
  }

  const handleBack = () => {
    setState('capturing')
  }

  const handlePublish = async (data: InferredData & { photo?: File }) => {
    setIsPublishing(true)
    try {
      // Use server action to create entry
      const isConnection = data.entry_type === 'connection'
      const defaultSurfaceConditions: SurfaceConditions = {
        time_windows: ['morning', 'midday', 'evening'],
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        min_interval_hours: 48,
        priority: 'normal',
      }

      const { createEntry } = await import('@/app/actions/entries')
      const result = await createEntry({
        headline: data.headline,
        subheading: data.subheading,
        category: data.category,
        content: data.content,
        mood: data.mood,
        entry_type: data.entry_type,
        due_date: data.due_date,
        connection_type: isConnection ? (data.connection_type as ConnectionType) : undefined,
        surface_conditions: isConnection ? defaultSurfaceConditions : undefined,
        // Multimodal fields - image_url from Vision API processing (legacy)
        image_url: data.image_url,
        image_extracted_data: data.image_extracted_data,
        // Multi-image gallery (new) - includes PDFs and documents
        images: data.images,
        // Metadata fields - auto-captured context
        metadata: data.metadata,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Upload photo if provided
      let photoUploadFailed = false
      if (data.photo && result.data) {
        const photoError = await uploadPhoto(data.photo, result.data.id)
        if (photoError) {
          photoUploadFailed = true
        }
      }

      // Success - close and refresh
      handleClose()
      onEntryCreated()

      // Notify user if photo upload failed (after modal closes so they see it)
      if (photoUploadFailed) {
        setTimeout(() => {
          alert('Your entry was published, but the photo failed to upload. You can add a photo by opening the entry.')
        }, 100)
      }
    } catch (error: any) {
      console.error('Error publishing entry:', error)
      alert(`Failed to publish: ${error.message || 'Unknown error'}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const uploadPhoto = async (photo: File, entryId: string): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', photo)
      formData.append('entryId', entryId)

      const photoResponse = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!photoResponse.ok) {
        const errorData = await photoResponse.json()
        console.error('Photo upload failed:', errorData)
        return errorData.error || 'Upload failed'
      }
      return null // Success
    } catch (photoErr: any) {
      console.error('Error uploading photo:', photoErr)
      return photoErr.message || 'Network error'
    }
  }

  // Render FAB button when closed
  if (state === 'closed') {
    return (
      <button
        onClick={handleOpen}
        aria-label="Capture a thought"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#DC143C',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 4px 20px rgba(220, 20, 60, 0.4)',
          cursor: 'pointer',
          fontSize: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          zIndex: 2000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(220, 20, 60, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(220, 20, 60, 0.4)'
        }}
      >
        +
      </button>
    )
  }

  // Render capture input when capturing
  if (state === 'capturing') {
    return (
      <CaptureInput
        onCapture={handleCapture}
        onClose={handleClose}
        userId={userId}
      />
    )
  }

  // Render confirmation when confirming
  if (state === 'confirming' && inferredData) {
    return (
      <CaptureConfirmation
        data={inferredData}
        onPublish={handlePublish}
        onBack={handleBack}
        isPublishing={isPublishing}
      />
    )
  }

  return null
}

