import PDFDocument from 'pdfkit'
import { Entry, WeeklyTheme } from '@/types'

// PDFKit configuration for serverless environments
// Use standard fonts that don't require external files
const PDF_OPTIONS = {
  size: 'LETTER',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  // Don't use custom fonts - use built-in standard fonts
  autoFirstPage: true,
}

export async function generateEntryPDF(entry: Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(PDF_OPTIONS)

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
    doc.on('error', reject)

    // Header - use standard fonts without specifying font family
    doc.fontSize(20).text(entry.headline, { align: 'center' })
    doc.moveDown(0.5)

    if (entry.subheading) {
      doc.fontSize(14).text(entry.subheading, { align: 'center' })
      doc.moveDown(1)
    }

    // Metadata
    doc.fontSize(10).fillColor('#666')
    doc.text(`Category: ${entry.category}`, { align: 'left' })
    if (entry.mood) {
      doc.text(`Mood: ${entry.mood}`, { align: 'left' })
    }
    doc.text(`Date: ${new Date(entry.created_at).toLocaleDateString()}`, { align: 'left' })
    doc.moveDown(1)
    doc.fillColor('#000')

    // Content
    doc.fontSize(12).text(entry.content, {
      align: 'left',
      lineGap: 5,
    })

    // Versions
    if (entry.versions && entry.versions.length > 0) {
      doc.addPage()
      doc.fontSize(18).text('AI Generated Versions', { align: 'center' })
      doc.moveDown(1)

      entry.versions.forEach((version, index) => {
        if (index > 0) {
          doc.addPage()
        }
        doc.fontSize(14).text(version.title, { align: 'left' })
        doc.moveDown(0.5)
        doc.fontSize(11).text(version.content, {
          align: 'left',
          lineGap: 4,
        })
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
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
    doc.on('error', reject)

    // Cover page - use standard fonts
    doc.fontSize(24).text(theme.headline, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(16).text(theme.subtitle, { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(12).fillColor('#666')
    doc.text(`Week of ${new Date(theme.week_start_date).toLocaleDateString()}`, {
      align: 'center',
    })
    doc.fillColor('#000')

    // Theme analysis
    doc.addPage()
    doc.fontSize(18).text('Weekly Theme Analysis', { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(12).text(theme.theme_content, {
      align: 'left',
      lineGap: 5,
    })

    // Entries
    entries.forEach((entry, index) => {
      doc.addPage()
      doc.fontSize(16).text(entry.headline, { align: 'left' })
      doc.moveDown(0.5)

      if (entry.subheading) {
        doc.fontSize(12).text(entry.subheading, { align: 'left' })
        doc.moveDown(0.5)
      }

      doc.fontSize(10).fillColor('#666')
      doc.text(`${entry.category} • ${new Date(entry.created_at).toLocaleDateString()}`)
      doc.moveDown(0.5)
      doc.fillColor('#000')

      doc.fontSize(11).text(entry.content, {
        align: 'left',
        lineGap: 4,
      })
    })

    doc.end()
  })
}

export async function generateMultiEntryPDF(entries: Entry[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(PDF_OPTIONS)

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
    doc.on('error', reject)

    // Cover - use standard fonts
    doc.fontSize(24).text('Journal Entries', { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(14).fillColor('#666')
    doc.text(`Collection of ${entries.length} entries`, { align: 'center' })
    doc.fillColor('#000')

    // Entries
    entries.forEach((entry, index) => {
      if (index > 0) {
        doc.addPage()
      }
      doc.fontSize(16).text(entry.headline, { align: 'left' })
      doc.moveDown(0.5)

      if (entry.subheading) {
        doc.fontSize(12).text(entry.subheading, { align: 'left' })
        doc.moveDown(0.5)
      }

      doc.fontSize(10).fillColor('#666')
      doc.text(`${entry.category} • ${new Date(entry.created_at).toLocaleDateString()}`)
      doc.moveDown(0.5)
      doc.fillColor('#000')

      doc.fontSize(11).text(entry.content, {
        align: 'left',
        lineGap: 4,
      })
    })

    doc.end()
  })
}

