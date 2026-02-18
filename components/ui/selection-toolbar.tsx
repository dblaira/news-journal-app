'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Copy, Check, Highlighter, Zap } from 'lucide-react'

interface SelectionToolbarProps {
  /** Called when the user clicks "Highlight" with the selected text range */
  onHighlight?: (start: number, end: number, text: string) => void
  /** Called when the user clicks "Copy" (optional — defaults to clipboard copy) */
  onCopy?: (text: string) => void
  /** Called when the user clicks "Connect" with the selected text */
  onConnect?: (text: string) => void
  /** Whether highlighting is enabled (shows the Highlight button) */
  highlightEnabled?: boolean
  /** Content to wrap — the toolbar listens for selections within this content */
  children: React.ReactNode
}

interface ToolbarPosition {
  top: number
  left: number
}

export function SelectionToolbar({
  onHighlight,
  onCopy,
  onConnect,
  highlightEnabled = true,
  children,
}: SelectionToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<ToolbarPosition>({ top: 0, left: 0 })
  const [copied, setCopied] = useState(false)
  const selectionDataRef = useRef<{ start: number; end: number; text: string } | null>(null)

  const getSelectionInfo = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
    if (!containerRef.current) return null

    const range = selection.getRangeAt(0)

    // Ensure selection is within the container
    if (
      !containerRef.current.contains(range.startContainer) ||
      !containerRef.current.contains(range.endContainer)
    ) {
      return null
    }

    const text = selection.toString().trim()
    if (!text || text.length < 2) return null

    // Compute character offsets by walking text nodes
    const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT)
    let charCount = 0
    let startOffset: number | null = null
    let endOffset: number | null = null

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const nodeLength = node.textContent?.length || 0

      if (node === range.startContainer) {
        startOffset = charCount + range.startOffset
      }
      if (node === range.endContainer) {
        endOffset = charCount + range.endOffset
        break
      }

      charCount += nodeLength
    }

    if (startOffset === null || endOffset === null || startOffset >= endOffset) return null

    // Get bounding rect for positioning (viewport-relative)
    const rect = range.getBoundingClientRect()

    return { start: startOffset, end: endOffset, text, rect }
  }, [])

  const handleMouseUp = useCallback(() => {
    // Small delay to let the browser finalize the selection
    requestAnimationFrame(() => {
      const info = getSelectionInfo()
      if (!info) {
        setVisible(false)
        selectionDataRef.current = null
        return
      }

      selectionDataRef.current = { start: info.start, end: info.end, text: info.text }

      // Position toolbar above the selection, centered — using fixed positioning (viewport coords)
      const toolbarWidth = 170
      const top = info.rect.top - 44
      const left = info.rect.left + info.rect.width / 2 - toolbarWidth / 2

      // Clamp to viewport edges
      setPosition({
        top: Math.max(8, top),
        left: Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8)),
      })
      setVisible(true)
      setCopied(false)
    })
  }, [getSelectionInfo])

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      // If clicking inside the toolbar, don't dismiss
      if (toolbarRef.current?.contains(e.target as Node)) return
      setVisible(false)
    },
    []
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [handleMouseUp, handleMouseDown])

  const handleCopy = useCallback(async () => {
    const data = selectionDataRef.current
    if (!data) return

    if (onCopy) {
      onCopy(data.text)
    }

    try {
      await navigator.clipboard.writeText(data.text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = data.text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setVisible(false)
      window.getSelection()?.removeAllRanges()
    }, 1200)
  }, [onCopy])

  const handleHighlight = useCallback(() => {
    const data = selectionDataRef.current
    if (!data) return

    onHighlight?.(data.start, data.end, data.text)
    setVisible(false)
    window.getSelection()?.removeAllRanges()
  }, [onHighlight])

  const handleConnect = useCallback(() => {
    const data = selectionDataRef.current
    if (!data) return

    onConnect?.(data.text)
    setVisible(false)
    window.getSelection()?.removeAllRanges()
  }, [onConnect])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {children}

      {visible && (
        <div
          ref={toolbarRef}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '4px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            animation: 'toolbar-pop-in 120ms ease-out',
          }}
          onMouseDown={(e) => {
            // Prevent toolbar from stealing focus / clearing selection
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {/* Copy button */}
          <button
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy selected text'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: copied ? '#4ade80' : '#e5e7eb',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all 0.12s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Divider */}
          {highlightEnabled && (
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
          )}

          {/* Highlight button */}
          {highlightEnabled && (
            <button
              onClick={handleHighlight}
              title="Highlight this passage"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: '#fcd34d',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500,
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(252, 211, 77, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Highlighter size={14} />
              <span>Highlight</span>
            </button>
          )}

          {/* Connect button */}
          {onConnect && (
            <>
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
              <button
                onClick={handleConnect}
                title="Save as Connection"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#a78bfa',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <Zap size={14} />
                <span>Connect</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
