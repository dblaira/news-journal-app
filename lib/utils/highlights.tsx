import { VersionHighlight } from '@/types'
import React from 'react'

/**
 * Merge overlapping or adjacent highlight ranges into a minimal set.
 * Input ranges do not need to be sorted.
 */
export function mergeHighlightRanges(ranges: VersionHighlight[]): VersionHighlight[] {
  if (ranges.length === 0) return []

  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const merged: VersionHighlight[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1]
    const curr = sorted[i]

    if (curr.start <= prev.end) {
      // Overlapping or adjacent — extend the previous range
      prev.end = Math.max(prev.end, curr.end)
    } else {
      merged.push({ start: curr.start, end: curr.end })
    }
  }

  return merged
}

/**
 * Add a new highlight range, merging with existing ranges if overlapping.
 */
export function addHighlight(
  existing: VersionHighlight[],
  newRange: VersionHighlight
): VersionHighlight[] {
  return mergeHighlightRanges([...existing, newRange])
}

/**
 * Remove a highlight that contains the given character offset.
 * Returns the updated array with the matching range removed.
 */
export function removeHighlightAt(
  highlights: VersionHighlight[],
  charOffset: number
): VersionHighlight[] {
  return highlights.filter((h) => !(charOffset >= h.start && charOffset < h.end))
}

/**
 * Compute the character offset of selected text relative to a container element.
 * Returns null if the selection is not within the container or is empty.
 */
export function getSelectionOffsets(
  containerEl: HTMLElement
): { start: number; end: number; text: string } | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)

  // Ensure the selection is within the container
  if (!containerEl.contains(range.startContainer) || !containerEl.contains(range.endContainer)) {
    return null
  }

  // Walk through text nodes to compute offsets
  const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT)
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

  if (startOffset === null || endOffset === null || startOffset === endOffset) return null

  const text = selection.toString()
  return { start: startOffset, end: endOffset, text }
}

interface HighlightSegment {
  text: string
  highlighted: boolean
  /** Character offset of the start of this segment within the full content string */
  offset: number
}

/**
 * Split content into segments based on highlight ranges.
 */
function splitIntoSegments(content: string, highlights: VersionHighlight[]): HighlightSegment[] {
  if (highlights.length === 0) {
    return [{ text: content, highlighted: false, offset: 0 }]
  }

  const merged = mergeHighlightRanges(highlights)
  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const h of merged) {
    // Clamp to content bounds
    const start = Math.max(0, Math.min(h.start, content.length))
    const end = Math.max(0, Math.min(h.end, content.length))

    if (start > cursor) {
      segments.push({ text: content.slice(cursor, start), highlighted: false, offset: cursor })
    }
    if (end > start) {
      segments.push({ text: content.slice(start, end), highlighted: true, offset: start })
    }
    cursor = end
  }

  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), highlighted: false, offset: cursor })
  }

  return segments
}

const HIGHLIGHT_STYLE: React.CSSProperties = {
  background: 'rgba(255, 213, 79, 0.45)',
  borderRadius: '2px',
  padding: '0 1px',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
  boxDecorationBreak: 'clone' as any,
  WebkitBoxDecorationBreak: 'clone' as any,
}

const HIGHLIGHT_HOVER_BG = 'rgba(255, 213, 79, 0.7)'

/**
 * Render a content string with highlighted spans.
 *
 * @param content  The full text string.
 * @param highlights  Array of {start, end} ranges to highlight.
 * @param onRemoveHighlight  Called when a highlighted span is clicked (for removal).
 */
export function renderWithHighlights(
  content: string,
  highlights: VersionHighlight[],
  onRemoveHighlight?: (charOffset: number) => void
): React.ReactNode[] {
  const segments = splitIntoSegments(content, highlights)

  return segments.map((seg) => {
    if (!seg.highlighted) {
      return (
        <React.Fragment key={`plain-${seg.offset}`}>
          {seg.text}
        </React.Fragment>
      )
    }

    return (
      <span
        key={`hl-${seg.offset}`}
        style={HIGHLIGHT_STYLE}
        title="Click to remove highlight"
        onClick={(e) => {
          e.stopPropagation()
          onRemoveHighlight?.(seg.offset)
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = HIGHLIGHT_HOVER_BG
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = HIGHLIGHT_STYLE.background as string
        }}
      >
        {seg.text}
      </span>
    )
  })
}
