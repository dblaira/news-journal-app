import { jsPDF } from 'jspdf'
import { Entry, WeeklyTheme } from '@/types'

// Helper to split text into lines that fit within page width
function splitTextIntoLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = doc.getTextWidth(testLine)
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}

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
  let yPos = margin

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const headlineLines = doc.splitTextToSize(entry.headline, maxWidth)
  doc.text(headlineLines, pageWidth / 2, yPos, { align: 'center' })
  yPos += headlineLines.length * 7 + 5

  if (entry.subheading) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'italic')
    const subheadingLines = doc.splitTextToSize(entry.subheading, maxWidth)
    doc.text(subheadingLines, pageWidth / 2, yPos, { align: 'center' })
    yPos += subheadingLines.length * 5 + 10
  }

  // Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(102, 102, 102)
  yPos += 5
  doc.text(`Category: ${entry.category}`, margin, yPos)
  yPos += 5
  if (entry.mood) {
    doc.text(`Mood: ${entry.mood}`, margin, yPos)
    yPos += 5
  }
  doc.text(`Date: ${new Date(entry.created_at).toLocaleDateString()}`, margin, yPos)
  yPos += 10
  doc.setTextColor(0, 0, 0)

  // Content
  doc.setFontSize(12)
  const contentLines = doc.splitTextToSize(entry.content, maxWidth)
  
  contentLines.forEach((line: string) => {
    if (yPos > pageHeight - margin - 10) {
      doc.addPage()
      yPos = margin
    }
    doc.text(line, margin, yPos)
    yPos += 6
  })

  // Versions
  if (entry.versions && entry.versions.length > 0) {
    doc.addPage()
    yPos = margin
    
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('AI Generated Versions', pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    entry.versions.forEach((version, index) => {
      if (index > 0) {
        doc.addPage()
        yPos = margin
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(version.title, maxWidth)
      titleLines.forEach((line: string) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage()
          yPos = margin
        }
        doc.text(line, margin, yPos)
        yPos += 7
      })
      yPos += 3

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      const versionLines = doc.splitTextToSize(version.content, maxWidth)
      versionLines.forEach((line: string) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage()
          yPos = margin
        }
        doc.text(line, margin, yPos)
        yPos += 5
      })
      yPos += 5
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
  let yPos = margin

  // Cover page
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  const headlineLines = doc.splitTextToSize(theme.headline, maxWidth)
  doc.text(headlineLines, pageWidth / 2, yPos, { align: 'center' })
  yPos += headlineLines.length * 8 + 10

  doc.setFontSize(16)
  doc.setFont('helvetica', 'italic')
  const subtitleLines = doc.splitTextToSize(theme.subtitle, maxWidth)
  doc.text(subtitleLines, pageWidth / 2, yPos, { align: 'center' })
  yPos += subtitleLines.length * 6 + 15

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(102, 102, 102)
  doc.text(`Week of ${new Date(theme.week_start_date).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Theme analysis
  doc.addPage()
  yPos = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Weekly Theme Analysis', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const themeLines = doc.splitTextToSize(theme.theme_content, maxWidth)
  themeLines.forEach((line: string) => {
    if (yPos > pageHeight - margin - 10) {
      doc.addPage()
      yPos = margin
    }
    doc.text(line, margin, yPos)
    yPos += 6
  })

  // Entries
  entries.forEach((entry, index) => {
    doc.addPage()
    yPos = margin

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const entryHeadlineLines = doc.splitTextToSize(entry.headline, maxWidth)
    entryHeadlineLines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 10) {
        doc.addPage()
        yPos = margin
      }
      doc.text(line, margin, yPos)
      yPos += 7
    })
    yPos += 3

    if (entry.subheading) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      const subheadingLines = doc.splitTextToSize(entry.subheading, maxWidth)
      subheadingLines.forEach((line: string) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage()
          yPos = margin
        }
        doc.text(line, margin, yPos)
        yPos += 5
      })
      yPos += 3
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(102, 102, 102)
    doc.text(`${entry.category} • ${new Date(entry.created_at).toLocaleDateString()}`, margin, yPos)
    yPos += 5
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(11)
    const entryContentLines = doc.splitTextToSize(entry.content, maxWidth)
    entryContentLines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 10) {
        doc.addPage()
        yPos = margin
      }
      doc.text(line, margin, yPos)
      yPos += 5
    })
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
  let yPos = margin

  // Cover
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Journal Entries', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(102, 102, 102)
  doc.text(`Collection of ${entries.length} entries`, pageWidth / 2, yPos, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // Entries
  entries.forEach((entry, index) => {
    if (index > 0) {
      doc.addPage()
      yPos = margin
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const headlineLines = doc.splitTextToSize(entry.headline, maxWidth)
    headlineLines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 10) {
        doc.addPage()
        yPos = margin
      }
      doc.text(line, margin, yPos)
      yPos += 7
    })
    yPos += 3

    if (entry.subheading) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      const subheadingLines = doc.splitTextToSize(entry.subheading, maxWidth)
      subheadingLines.forEach((line: string) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage()
          yPos = margin
        }
        doc.text(line, margin, yPos)
        yPos += 5
      })
      yPos += 3
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(102, 102, 102)
    doc.text(`${entry.category} • ${new Date(entry.created_at).toLocaleDateString()}`, margin, yPos)
    yPos += 5
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(11)
    const contentLines = doc.splitTextToSize(entry.content, maxWidth)
    contentLines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 10) {
        doc.addPage()
        yPos = margin
      }
      doc.text(line, margin, yPos)
      yPos += 5
    })
  })

  return Buffer.from(doc.output('arraybuffer'))
}

