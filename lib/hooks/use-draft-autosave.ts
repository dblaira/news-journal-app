'use client'

import { useEffect, useRef } from 'react'

export interface DraftData {
  text: string
  entryType?: string
  headline?: string
  timestamp: number
}

const AUTOSAVE_INTERVAL = 5000
const DRAFT_MAX_AGE = 24 * 60 * 60 * 1000

function getDraftKey(flowType: 'capture' | 'form'): string {
  return `understood-draft-${flowType}`
}

export function getSavedDraft(flowType: 'capture' | 'form'): DraftData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getDraftKey(flowType))
    if (!raw) return null

    const draft: DraftData = JSON.parse(raw)

    if (Date.now() - draft.timestamp > DRAFT_MAX_AGE) {
      localStorage.removeItem(getDraftKey(flowType))
      return null
    }

    if (!draft.text?.trim() && !draft.headline?.trim()) {
      localStorage.removeItem(getDraftKey(flowType))
      return null
    }

    return draft
  } catch {
    return null
  }
}

export function clearDraft(flowType: 'capture' | 'form'): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(getDraftKey(flowType))
  } catch {
    // Silently fail
  }
}

export function saveDraftNow(flowType: 'capture' | 'form', data: Omit<DraftData, 'timestamp'>): void {
  if (typeof window === 'undefined') return
  try {
    if (data.text?.trim() || data.headline?.trim()) {
      localStorage.setItem(
        getDraftKey(flowType),
        JSON.stringify({ ...data, timestamp: Date.now() })
      )
    }
  } catch {
    // localStorage full or unavailable
  }
}

export function useAutosaveDraft(
  flowType: 'capture' | 'form',
  getData: () => Omit<DraftData, 'timestamp'>,
  enabled: boolean = true,
) {
  const getDataRef = useRef(getData)
  getDataRef.current = getData

  useEffect(() => {
    if (!enabled) return

    const save = () => {
      const data = getDataRef.current()
      if (data.text?.trim() || data.headline?.trim()) {
        saveDraftNow(flowType, data)
      } else {
        clearDraft(flowType)
      }
    }

    const interval = setInterval(save, AUTOSAVE_INTERVAL)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        save()
      }
    }

    const handleBeforeUnload = () => {
      save()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
    }
  }, [flowType, enabled])
}
