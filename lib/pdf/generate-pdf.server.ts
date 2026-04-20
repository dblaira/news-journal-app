import PDFDocument from 'pdfkit'
import { Entry, WeeklyTheme } from '@/types'

// PDFKit configuration for serverless environments
const PDF_OPTIONS = {
  size: 'LETTER' as const,
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  autoFirstPage: true,
  font: undefined,
}

// ─── HTML-to-PDFKit Renderer ───────────────────────────────────────────
// Parses HTML content and renders with proper formatting in PDFKit.

// Simple HTML entity decoder
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ''))
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

function renderHtmlToPdfKit(doc: typeof PDFDocument.prototype, html: string): void {
  if (!html || !html.trim()) return

  const content = html.replace(/>\s+</g, '><').trim()
  const blockPattern = /<(p|h[1-6]|ul|ol|blockquote|pre|div|hr)([\s>])/gi
  const hasBlocks = blockPattern.test(content)

  if (!hasBlocks) {
    const text = stripHtml(content)
    if (text.trim()) {
      doc.fontSize(12).font('Helvetica').text(text, { lineGap: 5 })
      doc.moveDown(0.3)
    }
    return
  }

  const tokens = tokenizeHtml(content)
  for (const token of tokens) {
    renderPdfKitToken(doc, token)
  }
}

function renderPdfKitToken(doc: typeof PDFDocument.prototype, token: HtmlToken): void {
  switch (token.type) {
    case 'paragraph': {
      const text = stripInlineToRichText(doc, token.content)
      doc.moveDown(0.3)
      break
    }

    case 'heading': {
      const level = token.level || 2
      const sizes: Record<number, number> = { 1: 18, 2: 16, 3: 14, 4: 13, 5: 12, 6: 11 }
      doc.moveDown(0.5)
      doc.fontSize(sizes[level] || 14).font('Helvetica-Bold')
      doc.text(stripHtml(token.content), { lineGap: 3 })
      doc.moveDown(0.3)
      doc.font('Helvetica')
      break
    }

    case 'list': {
      const items = extractListItems(token.content)
      let counter = 0
      for (const item of items) {
        counter++
        const bullet = token.ordered ? `${counter}.  ` : '•  '
        const text = stripHtml(item)
        doc.fontSize(12).font('Helvetica')
        doc.text(`${bullet}${text}`, {
          indent: 15,
          lineGap: 3,
        })
      }
      doc.moveDown(0.3)
      break
    }

    case 'blockquote': {
      doc.moveDown(0.3)
      const text = stripHtml(token.content)
      if (text.trim()) {
        const x = doc.x
        // Save position for the bar
        const startY = doc.y
        doc.fontSize(12).font('Helvetica-Oblique')
        doc.text(text, doc.x + 15, doc.y, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20,
          lineGap: 4,
        })
        const endY = doc.y
        // Draw left bar
        doc.save()
        doc.moveTo(x + 5, startY).lineTo(x + 5, endY).lineWidth(1.5).strokeColor('#cccccc').stroke()
        doc.restore()
        doc.font('Helvetica')
      }
      doc.moveDown(0.3)
      break
    }

    case 'pre': {
      const text = stripHtml(token.content)
      if (!text.trim()) break
      doc.moveDown(0.3)
      doc.fontSize(9).font('Courier')
      doc.text(text, { lineGap: 2 })
      doc.font('Helvetica').fontSize(12)
      doc.moveDown(0.3)
      break
    }

    case 'hr': {
      doc.moveDown(0.5)
      const x = doc.x
      const y = doc.y
      const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
      doc.save()
      doc.moveTo(x, y).lineTo(x + width, y).lineWidth(0.5).strokeColor('#cccccc').stroke()
      doc.restore()
      doc.moveDown(0.5)
      break
    }

    case 'br': {
      doc.moveDown(0.3)
      break
    }

    case 'text': {
      if (token.content.trim()) {
        doc.fontSize(12).font('Helvetica').text(token.content, { lineGap: 5 })
        doc.moveDown(0.2)
      }
      break
    }
  }
}

// Render inline-formatted HTML to PDFKit with bold/italic support
function stripInlineToRichText(doc: typeof PDFDocument.prototype, html: string): void {
  // Process inline tags: <strong>, <b>, <em>, <i>, <code>, <a>, plain text
  const inlineRegex = /<(strong|b|em|i|u|code|a)\b[^>]*>([\s\S]*?)<\/\1>|([^<]+)|<br\s*\/?>/gi

  let hasContent = false
  let match
  const content = html.replace(/<\/?(p|div)\s*\/?>/gi, ' ')

  while ((match = inlineRegex.exec(content)) !== null) {
    const [, inlineTag, inlineContent, plainText] = match

    if (plainText) {
      const decoded = decodeEntities(plainText)
      if (decoded.trim() || decoded.includes(' ')) {
        doc.fontSize(12).font('Helvetica').text(decoded, { lineGap: 5, continued: true })
        hasContent = true
      }
    } else if (inlineTag) {
      const lower = inlineTag.toLowerCase()
      const text = stripHtml(inlineContent || '')
      if (!text) continue

      if (lower === 'strong' || lower === 'b') {
        doc.font('Helvetica-Bold').text(text, { continued: true })
        doc.font('Helvetica')
      } else if (lower === 'em' || lower === 'i') {
        doc.font('Helvetica-Oblique').text(text, { continued: true })
        doc.font('Helvetica')
      } else if (lower === 'code') {
        doc.font('Courier').fontSize(10).text(text, { continued: true })
        doc.font('Helvetica').fontSize(12)
      } else {
        doc.text(text, { continued: true })
      }
      hasContent = true
    }
  }

  // End the continued text
  if (hasContent) {
    doc.text('', { continued: false })
  } else {
    // Fallback
    const fallback = stripHtml(html).trim()
    if (fallback) {
      doc.fontSize(12).font('Helvetica').text(fallback, { lineGap: 5 })
    }
  }
}

// ─── PDF Generation Functions ──────────────────────────────────────────

export async function generateEntryPDF(entry: Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(PDF_OPTIONS)

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(entry.headline, { align: 'center' })
    doc.moveDown(0.5)

    if (entry.subheading) {
      doc.fontSize(14).font('Helvetica-Oblique').text(entry.subheading, { align: 'center' })
      doc.moveDown(1)
    }

    // Metadata
    doc.fontSize(10).font('Helvetica').fillColor('#666')
    doc.text(`Category: ${entry.category}`, { align: 'left' })
    if (entry.mood) {
      doc.text(`Mood: ${entry.mood}`, { align: 'left' })
    }
    doc.text(`Date: ${new Date(entry.created_at).toLocaleDateString()}`, { align: 'left' })
    doc.moveDown(1)
    doc.fillColor('#000')

    // Red divider
    const divX = doc.x
    const divY = doc.y
    const divWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    doc.save()
    doc.moveTo(divX, divY).lineTo(divX + divWidth, divY).lineWidth(1).strokeColor('#DC143C').stroke()
    doc.restore()
    doc.moveDown(0.8)

    // Content — parse HTML
    doc.fontSize(12).font('Helvetica')
    renderHtmlToPdfKit(doc, entry.content)

    // Versions
    if (entry.versions && entry.versions.length > 0) {
      doc.addPage()
      doc.fontSize(18).font('Helvetica-Bold').text('AI Generated Versions', { align: 'center' })
      doc.moveDown(1)

      entry.versions.forEach((version, index) => {
        if (index > 0) doc.addPage()
        doc.fontSize(14).font('Helvetica-Bold').text(version.title, { align: 'left' })
        doc.moveDown(0.5)
        doc.fontSize(11).font('Helvetica')
        renderHtmlToPdfKit(doc, version.content)
      })
    }

    doc.end()
  })
}

export async function generateWeeklyPDF(
  theme: WeeklyTheme,
  entries: Entry[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(PDF_OPTIONS)

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Cover page
    doc.fontSize(24).font('Helvetica-Bold').text(theme.headline, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(16).font('Helvetica-Oblique').text(theme.subtitle, { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(12).font('Helvetica').fillColor('#666')
    doc.text(`Week of ${new Date(theme.week_start_date).toLocaleDateString()}`, { align: 'center' })
    doc.fillColor('#000')

    // Theme analysis
    doc.addPage()
    doc.fontSize(18).font('Helvetica-Bold').text('Weekly Theme Analysis', { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(12).font('Helvetica')
    renderHtmlToPdfKit(doc, theme.theme_content)

    // Entries
    entries.forEach((entry) => {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold').text(entry.headline, { align: 'left' })
      doc.moveDown(0.5)

      if (entry.subheading) {
        doc.fontSize(12).font('Helvetica-Oblique').text(entry.subheading, { align: 'left' })
        doc.moveDown(0.5)
      }

      doc.fontSize(10).font('Helvetica').fillColor('#666')
      doc.text(`${entry.category} • ${new Date(entry.created_at).toLocaleDateString()}`)
      doc.moveDown(0.5)
      doc.fillColor('#000')

      // Red divider
      const x = doc.x
      const y = doc.y
      const w = doc.page.width - doc.page.margins.left - doc.page.margins.right
      doc.save()
      doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.5).strokeColor('#DC143C').stroke()
      doc.restore()
      doc.moveDown(0.6)

      doc.fontSize(11).font('Helvetica')
      renderHtmlToPdfKit(doc, entry.content)
    })

    doc.end()
  })
}

export async function generateMultiEntryPDF(entries: Entry[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(PDF_OPTIONS)

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Cover
    doc.fontSize(24).font('Helvetica-Bold').text('Journal Entries', { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(14).font('Helvetica').fillColor('#666')
    doc.text(`Collection of ${entries.length} entries`, { align: 'center' })
    doc.fillColor('#000')

    // Entries
    entries.forEach((entry) => {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold').text(entry.headline, { align: 'left' })
      doc.moveDown(0.5)

      if (entry.subheading) {
        doc.fontSize(12).font('Helvetica-Oblique').text(entry.subheading, { align: 'left' })
        doc.moveDown(0.5)
      }

      doc.fontSize(10).font('Helvetica').fillColor('#666')
      doc.text(`${entry.category} • ${new Date(entry.created_at).toLocaleDateString()}`)
      doc.moveDown(0.5)
      doc.fillColor('#000')

      // Red divider
      const x = doc.x
      const y = doc.y
      const w = doc.page.width - doc.page.margins.left - doc.page.margins.right
      doc.save()
      doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.5).strokeColor('#DC143C').stroke()
      doc.restore()
      doc.moveDown(0.6)

      doc.fontSize(11).font('Helvetica')
      renderHtmlToPdfKit(doc, entry.content)
    })

    doc.end()
  })
}
