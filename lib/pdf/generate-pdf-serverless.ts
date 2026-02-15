import { jsPDF } from 'jspdf'
import { Entry, WeeklyTheme } from '@/types'

// ─── HTML-to-PDF Renderer ──────────────────────────────────────────────
// Parses HTML content and renders it with proper formatting in jsPDF.
// Supports: <p>, <strong>/<b>, <em>/<i>, <u>, <h1>-<h6>, <ul>/<ol>/<li>,
//           <blockquote>, <br>, <a>, <code>, <pre>, inline text nodes

interface RenderContext {
  doc: jsPDF
  yPos: number
  margin: number
  maxWidth: number
  pageHeight: number
  pageWidth: number
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic'
  listDepth: number
  isBlockquote: boolean
}

function ensureSpace(ctx: RenderContext, needed: number): RenderContext {
  if (ctx.yPos + needed > ctx.pageHeight - ctx.margin - 10) {
    ctx.doc.addPage()
    ctx.yPos = ctx.margin
  }
  return ctx
}

// Simple HTML entity decoder
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
}

// Extract plain text from an HTML string (strip all tags)
function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim()
}

// ─── Inline Segment Model ──────────────────────────────────────────────

interface InlineSegment {
  text: string
  bold: boolean
  italic: boolean
  code: boolean
}

// Parse inline HTML into segments preserving bold/italic/code
function parseInlineSegments(html: string): InlineSegment[] {
  // Strip block-level wrappers
  let content = html.replace(/<\/?(p|div)\s*\/?>/gi, '')
  content = content.replace(/<br\s*\/?>/gi, '\n')

  const segments: InlineSegment[] = []

  // Match inline tags or plain text
  const regex = /<(strong|b|em|i|u|code|a)\b[^>]*>([\s\S]*?)<\/\1>|([^<]+)/gi
  let match
  while ((match = regex.exec(content)) !== null) {
    const [, tag, tagContent, plainText] = match

    if (plainText) {
      const decoded = decodeEntities(plainText)
      if (decoded) {
        segments.push({ text: decoded, bold: false, italic: false, code: false })
      }
    } else if (tag && tagContent) {
      const lower = tag.toLowerCase()
      const text = stripHtml(tagContent)
      if (!text) continue

      // Handle nested tags (e.g. <strong><em>text</em></strong>)
      const isBold = lower === 'strong' || lower === 'b' || /<(strong|b)\b/i.test(tagContent)
      const isItalic = lower === 'em' || lower === 'i' || /<(em|i)\b/i.test(tagContent)
      const isCode = lower === 'code'

      segments.push({ text, bold: isBold, italic: isItalic, code: isCode })
    }
  }

  if (segments.length === 0) {
    const fallback = stripHtml(html)
    if (fallback) {
      segments.push({ text: fallback, bold: false, italic: false, code: false })
    }
  }

  return segments
}

// Render inline segments as flowing text with mixed fonts on the same lines
function renderInlineSegments(ctx: RenderContext, segments: InlineSegment[], indent: number = 0): RenderContext {
  if (segments.length === 0) return ctx

  const effectiveMargin = ctx.margin + indent + (ctx.isBlockquote ? 8 : 0)
  const effectiveWidth = ctx.maxWidth - indent - (ctx.isBlockquote ? 8 : 0)
  const lineHeight = ctx.fontSize * 0.45

  // Flatten all segments into a single text to word-wrap correctly,
  // then render word-by-word with the correct font for each word.
  // Build a word list with style info.
  interface StyledWord {
    word: string
    bold: boolean
    italic: boolean
    code: boolean
    trailingSpace: boolean
  }

  const words: StyledWord[] = []
  for (const seg of segments) {
    const parts = seg.text.split(/(\s+)/)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue
      if (/^\s+$/.test(part)) {
        // Attach trailing space to previous word
        if (words.length > 0) {
          words[words.length - 1].trailingSpace = true
        }
      } else {
        words.push({
          word: part,
          bold: seg.bold,
          italic: seg.italic,
          code: seg.code,
          trailingSpace: false,
        })
      }
    }
  }

  if (words.length === 0) return ctx

  // Render words, tracking X position for inline flow
  let xPos = effectiveMargin
  ctx = ensureSpace(ctx, lineHeight + 1)

  // Draw blockquote bar at start
  if (ctx.isBlockquote) {
    const barX = ctx.margin + indent + 2
    ctx.doc.setDrawColor(200, 200, 200)
    ctx.doc.setLineWidth(0.8)
    ctx.doc.line(barX, ctx.yPos - 3, barX, ctx.yPos + 1)
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const fontName = w.code ? 'courier' : 'helvetica'
    let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'
    if (w.bold && w.italic) fontStyle = 'bolditalic'
    else if (w.bold) fontStyle = 'bold'
    else if (w.italic) fontStyle = 'italic'

    const fontSize = w.code ? ctx.fontSize - 1 : ctx.fontSize
    ctx.doc.setFont(fontName, fontStyle)
    ctx.doc.setFontSize(fontSize)

    const wordText = w.word + (w.trailingSpace ? ' ' : '')
    const wordWidth = ctx.doc.getTextWidth(wordText)

    // Check if word fits on current line
    if (xPos + wordWidth > effectiveMargin + effectiveWidth && xPos > effectiveMargin) {
      // Wrap to next line
      ctx.yPos += lineHeight
      xPos = effectiveMargin
      ctx = ensureSpace(ctx, lineHeight + 1)

      if (ctx.isBlockquote) {
        const barX = ctx.margin + indent + 2
        ctx.doc.setDrawColor(200, 200, 200)
        ctx.doc.setLineWidth(0.8)
        ctx.doc.line(barX, ctx.yPos - 3, barX, ctx.yPos + 1)
      }
    }

    // Add space before word if not at line start and previous word had no trailing space
    if (xPos > effectiveMargin && i > 0 && !words[i - 1].trailingSpace) {
      ctx.doc.setFont('helvetica', 'normal')
      ctx.doc.setFontSize(ctx.fontSize)
      const spaceWidth = ctx.doc.getTextWidth(' ')
      xPos += spaceWidth
    }

    ctx.doc.setFont(fontName, fontStyle)
    ctx.doc.setFontSize(fontSize)
    ctx.doc.text(w.word, xPos, ctx.yPos)
    xPos += wordWidth

    // If trailing space, it's already included in wordWidth
  }

  ctx.yPos += lineHeight
  // Reset font
  ctx.doc.setFont('helvetica', ctx.fontStyle)
  ctx.doc.setFontSize(ctx.fontSize)

  return ctx
}

// Render a plain text block (no inline formatting)
function renderTextBlock(ctx: RenderContext, text: string, indent: number = 0): RenderContext {
  if (!text.trim()) return ctx

  const effectiveMargin = ctx.margin + indent + (ctx.isBlockquote ? 8 : 0)
  const effectiveWidth = ctx.maxWidth - indent - (ctx.isBlockquote ? 8 : 0)

  ctx.doc.setFontSize(ctx.fontSize)
  ctx.doc.setFont('helvetica', ctx.fontStyle)

  const lines = ctx.doc.splitTextToSize(text, effectiveWidth)
  const lineHeight = ctx.fontSize * 0.45

  lines.forEach((line: string) => {
    ctx = ensureSpace(ctx, lineHeight + 1)

    if (ctx.isBlockquote) {
      const barX = ctx.margin + indent + 2
      ctx.doc.setDrawColor(200, 200, 200)
      ctx.doc.setLineWidth(0.8)
      ctx.doc.line(barX, ctx.yPos - 3, barX, ctx.yPos + 1)
    }

    ctx.doc.text(line, effectiveMargin, ctx.yPos)
    ctx.yPos += lineHeight
  })

  return ctx
}

// ─── HTML Tokenizer ────────────────────────────────────────────────────

interface HtmlToken {
  type: 'paragraph' | 'heading' | 'list' | 'blockquote' | 'pre' | 'hr' | 'text' | 'br'
  tag?: string
  content: string
  level?: number
  ordered?: boolean
}

function tokenizeHtml(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = []
  const blockRegex = /<(p|h([1-6])|ul|ol|blockquote|pre|div|hr)\b[^>]*>([\s\S]*?)<\/\1>|<(hr|br)\s*\/?>|([^<]+)/gi

  let match
  while ((match = blockRegex.exec(html)) !== null) {
    const [, tag, headingLevel, innerContent, selfClosing, textContent] = match

    if (selfClosing) {
      tokens.push({ type: selfClosing.toLowerCase() === 'hr' ? 'hr' : 'br', content: '' })
    } else if (textContent) {
      const cleaned = decodeEntities(textContent).trim()
      if (cleaned) tokens.push({ type: 'text', content: cleaned })
    } else if (tag) {
      const lowerTag = tag.toLowerCase()
      if (lowerTag === 'p' || lowerTag === 'div') {
        tokens.push({ type: 'paragraph', tag: lowerTag, content: innerContent || '' })
      } else if (lowerTag.startsWith('h')) {
        tokens.push({ type: 'heading', tag: lowerTag, content: innerContent || '', level: parseInt(headingLevel || '2') })
      } else if (lowerTag === 'ul' || lowerTag === 'ol') {
        tokens.push({ type: 'list', tag: lowerTag, content: innerContent || '', ordered: lowerTag === 'ol' })
      } else if (lowerTag === 'blockquote') {
        tokens.push({ type: 'blockquote', tag: lowerTag, content: innerContent || '' })
      } else if (lowerTag === 'pre') {
        tokens.push({ type: 'pre', tag: lowerTag, content: innerContent || '' })
      }
    }
  }
  return tokens
}

// ─── Token Renderer ────────────────────────────────────────────────────

function renderHtmlContent(ctx: RenderContext, html: string): RenderContext {
  if (!html || !html.trim()) return ctx

  const content = html.replace(/>\s+</g, '><').trim()
  const blockPattern = /<(p|h[1-6]|ul|ol|blockquote|pre|div|hr)([\s>])/gi
  const hasBlocks = blockPattern.test(content)

  if (!hasBlocks) {
    const segments = parseInlineSegments(content)
    ctx = renderInlineSegments(ctx, segments)
    ctx.yPos += 3
    return ctx
  }

  const tokens = tokenizeHtml(content)
  for (const token of tokens) {
    ctx = renderToken(ctx, token)
  }
  return ctx
}

function renderToken(ctx: RenderContext, token: HtmlToken): RenderContext {
  switch (token.type) {
    case 'paragraph': {
      const segments = parseInlineSegments(token.content)
      if (segments.length > 0) {
        ctx = renderInlineSegments(ctx, segments)
      }
      ctx.yPos += 3
      return ctx
    }

    case 'heading': {
      const level = token.level || 2
      const sizes: Record<number, number> = { 1: 18, 2: 16, 3: 14, 4: 13, 5: 12, 6: 11 }
      const prevSize = ctx.fontSize
      const prevStyle = ctx.fontStyle

      ctx.yPos += 4
      ctx = ensureSpace(ctx, 10)
      ctx.fontSize = sizes[level] || 14
      ctx.fontStyle = 'bold'

      const text = stripHtml(token.content)
      ctx = renderTextBlock(ctx, text)
      ctx.yPos += 2

      ctx.fontSize = prevSize
      ctx.fontStyle = prevStyle
      return ctx
    }

    case 'list': {
      const items = extractListItems(token.content)
      ctx.listDepth += 1
      let counter = 0

      for (const item of items) {
        counter++
        const indent = ctx.listDepth * 8
        const bullet = token.ordered ? `${counter}.` : '\u2022'

        ctx = ensureSpace(ctx, 6)

        // Render bullet/number
        ctx.doc.setFontSize(ctx.fontSize)
        ctx.doc.setFont('helvetica', 'normal')
        ctx.doc.text(bullet, ctx.margin + indent - 6, ctx.yPos)

        // Render item content with inline formatting
        const segments = parseInlineSegments(item)
        ctx = renderInlineSegments(ctx, segments, indent)
        ctx.yPos += 1.5
      }

      ctx.listDepth -= 1
      ctx.yPos += 2
      return ctx
    }

    case 'blockquote': {
      const prevBq = ctx.isBlockquote
      ctx.isBlockquote = true
      ctx.yPos += 2

      const innerTokens = tokenizeHtml(token.content)
      if (innerTokens.length > 0) {
        for (const inner of innerTokens) {
          ctx = renderToken(ctx, inner)
        }
      } else {
        const prevStyle = ctx.fontStyle
        ctx.fontStyle = 'italic'
        const text = stripHtml(token.content)
        if (text.trim()) {
          ctx = renderTextBlock(ctx, text)
        }
        ctx.fontStyle = prevStyle
      }

      ctx.isBlockquote = prevBq
      ctx.yPos += 2
      return ctx
    }

    case 'pre': {
      const text = stripHtml(token.content)
      if (!text.trim()) return ctx

      ctx.yPos += 2
      ctx = ensureSpace(ctx, 10)

      const prevSize = ctx.fontSize
      ctx.fontSize = 9
      ctx.doc.setFontSize(9)
      ctx.doc.setFont('courier', 'normal')

      const lines = ctx.doc.splitTextToSize(text, ctx.maxWidth - 10)
      const blockHeight = lines.length * 4 + 6

      ctx.doc.setFillColor(245, 245, 245)
      ctx.doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.maxWidth, blockHeight, 1, 1, 'F')

      ctx.doc.setTextColor(51, 51, 51)
      lines.forEach((line: string) => {
        ctx = ensureSpace(ctx, 5)
        ctx.doc.text(line, ctx.margin + 4, ctx.yPos)
        ctx.yPos += 4
      })
      ctx.doc.setTextColor(0, 0, 0)
      ctx.doc.setFont('helvetica', 'normal')
      ctx.fontSize = prevSize
      ctx.yPos += 3
      return ctx
    }

    case 'hr': {
      ctx.yPos += 4
      ctx = ensureSpace(ctx, 6)
      ctx.doc.setDrawColor(200, 200, 200)
      ctx.doc.setLineWidth(0.3)
      ctx.doc.line(ctx.margin, ctx.yPos, ctx.margin + ctx.maxWidth, ctx.yPos)
      ctx.yPos += 4
      return ctx
    }

    case 'br': {
      ctx.yPos += 3
      return ctx
    }

    case 'text': {
      if (token.content.trim()) {
        ctx = renderTextBlock(ctx, token.content)
        ctx.yPos += 2
      }
      return ctx
    }

    default:
      return ctx
  }
}

function extractListItems(html: string): string[] {
  const items: string[] = []
  const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi
  let liMatch
  while ((liMatch = liRegex.exec(html)) !== null) {
    items.push(liMatch[1])
  }
  if (items.length === 0) {
    const text = stripHtml(html)
    if (text.trim()) {
      items.push(...text.split('\n').filter(l => l.trim()))
    }
  }
  return items
}

// ─── PDF Generation Functions ──────────────────────────────────────────

export async function generateEntryPDF(entry: Entry): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin

  let ctx: RenderContext = {
    doc, yPos: margin, margin, maxWidth, pageHeight, pageWidth,
    fontSize: 12, fontStyle: 'normal', listDepth: 0, isBlockquote: false,
  }

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const headlineLines = doc.splitTextToSize(entry.headline, maxWidth)
  doc.text(headlineLines, pageWidth / 2, ctx.yPos, { align: 'center' })
  ctx.yPos += headlineLines.length * 7 + 5

  if (entry.subheading) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'italic')
    const subheadingLines = doc.splitTextToSize(entry.subheading, maxWidth)
    doc.text(subheadingLines, pageWidth / 2, ctx.yPos, { align: 'center' })
    ctx.yPos += subheadingLines.length * 5 + 10
  }

  // Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(102, 102, 102)
  ctx.yPos += 5
  doc.text(`Category: ${entry.category}`, margin, ctx.yPos)
  ctx.yPos += 5
  if (entry.mood) {
    doc.text(`Mood: ${entry.mood}`, margin, ctx.yPos)
    ctx.yPos += 5
  }
  doc.text(`Date: ${new Date(entry.created_at).toLocaleDateString()}`, margin, ctx.yPos)
  ctx.yPos += 10
  doc.setTextColor(0, 0, 0)

  // Divider
  doc.setDrawColor(220, 20, 60)
  doc.setLineWidth(0.5)
  doc.line(margin, ctx.yPos, margin + maxWidth, ctx.yPos)
  ctx.yPos += 8

  // Content — parse HTML and render with formatting
  ctx.fontSize = 12
  ctx.fontStyle = 'normal'
  ctx = renderHtmlContent(ctx, entry.content)

  // Versions
  if (entry.versions && entry.versions.length > 0) {
    doc.addPage()
    ctx.yPos = margin

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('AI Generated Versions', pageWidth / 2, ctx.yPos, { align: 'center' })
    ctx.yPos += 15

    entry.versions.forEach((version, index) => {
      if (index > 0) {
        doc.addPage()
        ctx.yPos = margin
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(version.title, maxWidth)
      titleLines.forEach((line: string) => {
        ctx = ensureSpace(ctx, 8)
        doc.text(line, margin, ctx.yPos)
        ctx.yPos += 7
      })
      ctx.yPos += 3

      ctx.fontSize = 11
      ctx.fontStyle = 'normal'
      ctx = renderHtmlContent(ctx, version.content)
    })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

export async function generateWeeklyPDF(
  theme: WeeklyTheme,
  entries: Entry[]
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin

  let ctx: RenderContext = {
    doc, yPos: margin, margin, maxWidth, pageHeight, pageWidth,
    fontSize: 12, fontStyle: 'normal', listDepth: 0, isBlockquote: false,
  }

  // Cover page
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  const headlineLines = doc.splitTextToSize(theme.headline, maxWidth)
  doc.text(headlineLines, pageWidth / 2, ctx.yPos, { align: 'center' })
  ctx.yPos += headlineLines.length * 8 + 10

  doc.setFontSize(16)
  doc.setFont('helvetica', 'italic')
  const subtitleLines = doc.splitTextToSize(theme.subtitle, maxWidth)
  doc.text(subtitleLines, pageWidth / 2, ctx.yPos, { align: 'center' })
  ctx.yPos += subtitleLines.length * 6 + 15

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(102, 102, 102)
  doc.text(`Week of ${new Date(theme.week_start_date).toLocaleDateString()}`, pageWidth / 2, ctx.yPos, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Theme analysis
  doc.addPage()
  ctx.yPos = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Weekly Theme Analysis', pageWidth / 2, ctx.yPos, { align: 'center' })
  ctx.yPos += 15

  ctx.fontSize = 12
  ctx.fontStyle = 'normal'
  ctx = renderHtmlContent(ctx, theme.theme_content)

  // Entries
  entries.forEach((entry) => {
    doc.addPage()
    ctx.yPos = margin

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const entryHeadlineLines = doc.splitTextToSize(entry.headline, maxWidth)
    entryHeadlineLines.forEach((line: string) => {
      ctx = ensureSpace(ctx, 8)
      doc.text(line, margin, ctx.yPos)
      ctx.yPos += 7
    })
    ctx.yPos += 3

    if (entry.subheading) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      const subheadingLines = doc.splitTextToSize(entry.subheading, maxWidth)
      subheadingLines.forEach((line: string) => {
        ctx = ensureSpace(ctx, 6)
        doc.text(line, margin, ctx.yPos)
        ctx.yPos += 5
      })
      ctx.yPos += 3
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(102, 102, 102)
    doc.text(`${entry.category} \u2022 ${new Date(entry.created_at).toLocaleDateString()}`, margin, ctx.yPos)
    ctx.yPos += 8
    doc.setTextColor(0, 0, 0)

    doc.setDrawColor(220, 20, 60)
    doc.setLineWidth(0.3)
    doc.line(margin, ctx.yPos, margin + maxWidth, ctx.yPos)
    ctx.yPos += 6

    ctx.fontSize = 11
    ctx.fontStyle = 'normal'
    ctx = renderHtmlContent(ctx, entry.content)
  })

  return Buffer.from(doc.output('arraybuffer'))
}

export async function generateMultiEntryPDF(entries: Entry[]): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin

  let ctx: RenderContext = {
    doc, yPos: margin, margin, maxWidth, pageHeight, pageWidth,
    fontSize: 12, fontStyle: 'normal', listDepth: 0, isBlockquote: false,
  }

  // Cover
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Journal Entries', pageWidth / 2, ctx.yPos, { align: 'center' })
  ctx.yPos += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(102, 102, 102)
  doc.text(`Collection of ${entries.length} entries`, pageWidth / 2, ctx.yPos, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Entries
  entries.forEach((entry) => {
    doc.addPage()
    ctx.yPos = margin

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const headlineLines = doc.splitTextToSize(entry.headline, maxWidth)
    headlineLines.forEach((line: string) => {
      ctx = ensureSpace(ctx, 8)
      doc.text(line, margin, ctx.yPos)
      ctx.yPos += 7
    })
    ctx.yPos += 3

    if (entry.subheading) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      const subheadingLines = doc.splitTextToSize(entry.subheading, maxWidth)
      subheadingLines.forEach((line: string) => {
        ctx = ensureSpace(ctx, 6)
        doc.text(line, margin, ctx.yPos)
        ctx.yPos += 5
      })
      ctx.yPos += 3
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(102, 102, 102)
    doc.text(`${entry.category} \u2022 ${new Date(entry.created_at).toLocaleDateString()}`, margin, ctx.yPos)
    ctx.yPos += 8
    doc.setTextColor(0, 0, 0)

    doc.setDrawColor(220, 20, 60)
    doc.setLineWidth(0.3)
    doc.line(margin, ctx.yPos, margin + maxWidth, ctx.yPos)
    ctx.yPos += 6

    ctx.fontSize = 11
    ctx.fontStyle = 'normal'
    ctx = renderHtmlContent(ctx, entry.content)
  })

  return Buffer.from(doc.output('arraybuffer'))
}
