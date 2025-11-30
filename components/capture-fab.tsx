'use client'

import { useState } from 'react'
import { CaptureInput } from './capture-input'
import { CaptureConfirmation } from './capture-confirmation'
import { Entry } from '@/types'

interface InferredData {
  headline: string
  subheading: string
  category: Entry['category']
  mood: string
  content: string
}

interface CaptureFABProps {
  onEntryCreated: () => void
}

type CaptureState = 'closed' | 'capturing' | 'confirming'

export function CaptureFAB({ onEntryCreated }: CaptureFABProps) {
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
      const { createEntry } = await import('@/app/actions/entries')
      const result = await createEntry({
        headline: data.headline,
        subheading: data.subheading,
        category: data.category,
        content: data.content,
        mood: data.mood,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Upload photo if provided
      if (data.photo && result.data) {
        await uploadPhoto(data.photo, result.data.id)
      }

      // Success
      handleClose()
      onEntryCreated()
    } catch (error: any) {
      console.error('Error publishing entry:', error)
      alert(`Failed to publish: ${error.message || 'Unknown error'}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const uploadPhoto = async (photo: File, entryId: string) => {
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
      }
    } catch (photoErr) {
      console.error('Error uploading photo:', photoErr)
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

