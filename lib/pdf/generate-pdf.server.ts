import PDFDocument from 'pdfkit'
import { Entry, WeeklyTheme } from '@/types'

export async function generateEntryPDF(entry: Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
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

    // Content
    doc.fontSize(12).font('Helvetica').text(entry.content, {
      align: 'left',
      lineGap: 5,
    })

    // Versions
    if (entry.versions && entry.versions.length > 0) {
      doc.addPage()
      doc.fontSize(18).font('Helvetica-Bold').text('AI Generated Versions', { align: 'center' })
      doc.moveDown(1)

      entry.versions.forEach((version, index) => {
        if (index > 0) {
          doc.addPage()
        }
        doc.fontSize(14).font('Helvetica-Bold').text(version.title, { align: 'left' })
        doc.moveDown(0.5)
        doc.fontSize(11).font('Helvetica').text(version.content, {
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
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
    doc.on('error', reject)

    // Cover page
    doc.fontSize(24).font('Helvetica-Bold').text(theme.headline, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(16).font('Helvetica-Oblique').text(theme.subtitle, { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(12).font('Helvetica').fillColor('#666')
    doc.text(`Week of ${new Date(theme.week_start_date).toLocaleDateString()}`, {
      align: 'center',
    })
    doc.fillColor('#000')

    // Theme analysis
    doc.addPage()
    doc.fontSize(18).font('Helvetica-Bold').text('Weekly Theme Analysis', { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(12).font('Helvetica').text(theme.theme_content, {
      align: 'left',
      lineGap: 5,
    })

    // Entries
    entries.forEach((entry, index) => {
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

      doc.fontSize(11).font('Helvetica').text(entry.content, {
        align: 'left',
        lineGap: 4,
      })
    })

    doc.end()
  })
}

export async function generateMultiEntryPDF(entries: Entry[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
    doc.on('error', reject)

    // Cover
    doc.fontSize(24).font('Helvetica-Bold').text('Journal Entries', { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(14).font('Helvetica').fillColor('#666')
    doc.text(`Collection of ${entries.length} entries`, { align: 'center' })
    doc.fillColor('#000')

    // Entries
    entries.forEach((entry, index) => {
      if (index > 0) {
        doc.addPage()
      }
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

      doc.fontSize(11).font('Helvetica').text(entry.content, {
        align: 'left',
        lineGap: 4,
      })
    })

    doc.end()
  })
}

