import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { Entry } from '@/types'

export const runtime = 'nodejs'

type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'docx'

// Strip HTML tags for plain text export
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Generate PDF export
async function generatePDF(entries: Entry[], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Title page
    doc.fontSize(28).font('Helvetica-Bold').text(title, { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).font('Helvetica').text(`Exported on ${formatDate(new Date().toISOString())}`, { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).fillColor('#666').text(`${entries.length} entries`, { align: 'center' })
    doc.fillColor('#000')
    
    // Add entries
    entries.forEach((entry, index) => {
      if (index > 0) {
        doc.addPage()
      } else {
        doc.addPage()
      }

      // Category badge
      doc.fontSize(10).fillColor('#DC143C').text(entry.category.toUpperCase(), { continued: false })
      doc.fillColor('#000')
      doc.moveDown(0.5)

      // Headline
      doc.fontSize(20).font('Helvetica-Bold').text(entry.headline || 'Untitled')
      doc.moveDown(0.3)

      // Subheading
      if (entry.subheading) {
        doc.fontSize(12).font('Helvetica-Oblique').fillColor('#555').text(entry.subheading)
        doc.fillColor('#000')
      }
      doc.moveDown(0.5)

      // Metadata line
      doc.fontSize(9).font('Helvetica').fillColor('#888')
      const metaLine = [
        formatDate(entry.created_at),
        entry.entry_type ? `Type: ${entry.entry_type}` : null,
        entry.mood ? `Mood: ${entry.mood}` : null,
      ].filter(Boolean).join(' • ')
      doc.text(metaLine)
      doc.fillColor('#000')
      doc.moveDown()

      // Content
      const content = stripHtml(entry.content || '')
      doc.fontSize(11).font('Helvetica').text(content, {
        align: 'left',
        lineGap: 4,
      })

      // Versions if available
      if (entry.versions && entry.versions.length > 0) {
        doc.moveDown()
        doc.fontSize(10).font('Helvetica-Bold').text('Enhanced Versions:')
        doc.moveDown(0.5)
        
        entry.versions.forEach((version: any) => {
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#DC143C').text(`${version.style}:`)
          doc.fillColor('#000')
          doc.fontSize(9).font('Helvetica').text(stripHtml(version.content || ''), { indent: 10 })
          doc.moveDown(0.5)
        })
      }
    })

    doc.end()
  })
}

// Generate CSV export
function generateCSV(entries: Entry[]): string {
  const headers = [
    'ID',
    'Headline',
    'Subheading',
    'Category',
    'Entry Type',
    'Mood',
    'Content',
    'Created At',
    'Updated At',
    'View Count',
    'Has Versions',
  ]

  const rows = entries.map(entry => [
    entry.id,
    `"${(entry.headline || '').replace(/"/g, '""')}"`,
    `"${(entry.subheading || '').replace(/"/g, '""')}"`,
    entry.category,
    entry.entry_type || 'story',
    entry.mood || '',
    `"${stripHtml(entry.content || '').replace(/"/g, '""')}"`,
    entry.created_at,
    entry.updated_at || '',
    entry.view_count || 0,
    entry.versions ? 'Yes' : 'No',
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

// Generate XLSX export
function generateXLSX(entries: Entry[]): Buffer {
  const data = entries.map(entry => ({
    ID: entry.id,
    Headline: entry.headline || '',
    Subheading: entry.subheading || '',
    Category: entry.category,
    'Entry Type': entry.entry_type || 'story',
    Mood: entry.mood || '',
    Content: stripHtml(entry.content || ''),
    'Created At': formatDate(entry.created_at),
    'Updated At': entry.updated_at ? formatDate(entry.updated_at) : '',
    'View Count': entry.view_count || 0,
    'Has Versions': entry.versions ? 'Yes' : 'No',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries')

  // Set column widths
  worksheet['!cols'] = [
    { wch: 36 }, // ID
    { wch: 40 }, // Headline
    { wch: 30 }, // Subheading
    { wch: 12 }, // Category
    { wch: 10 }, // Entry Type
    { wch: 15 }, // Mood
    { wch: 60 }, // Content
    { wch: 20 }, // Created At
    { wch: 20 }, // Updated At
    { wch: 10 }, // View Count
    { wch: 12 }, // Has Versions
  ]

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

// Generate DOCX export
async function generateDOCX(entries: Entry[], title: string): Promise<Buffer> {
  const children: any[] = []

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Exported on ${formatDate(new Date().toISOString())}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `${entries.length} entries`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: '' }) // Spacer
  )

  // Add entries
  entries.forEach((entry, index) => {
    // Separator between entries
    if (index > 0) {
      children.push(
        new Paragraph({ text: '─'.repeat(50) }),
        new Paragraph({ text: '' })
      )
    }

    // Category
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: entry.category.toUpperCase(),
            bold: true,
            color: 'DC143C',
            size: 20,
          }),
        ],
      })
    )

    // Headline
    children.push(
      new Paragraph({
        text: entry.headline || 'Untitled',
        heading: HeadingLevel.HEADING_1,
      })
    )

    // Subheading
    if (entry.subheading) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: entry.subheading,
              italics: true,
              color: '555555',
            }),
          ],
        })
      )
    }

    // Metadata
    const metaLine = [
      formatDate(entry.created_at),
      entry.entry_type ? `Type: ${entry.entry_type}` : null,
      entry.mood ? `Mood: ${entry.mood}` : null,
    ].filter(Boolean).join(' • ')

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: metaLine,
            size: 18,
            color: '888888',
          }),
        ],
      }),
      new Paragraph({ text: '' }) // Spacer
    )

    // Content
    const content = stripHtml(entry.content || '')
    const paragraphs = content.split('\n').filter(p => p.trim())
    paragraphs.forEach(p => {
      children.push(
        new Paragraph({
          text: p,
        })
      )
    })

    // Versions
    if (entry.versions && entry.versions.length > 0) {
      children.push(
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Enhanced Versions:',
          heading: HeadingLevel.HEADING_2,
        })
      )

      entry.versions.forEach((version: any) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${version.style}: `,
                bold: true,
                color: 'DC143C',
              }),
              new TextRun({
                text: stripHtml(version.content || ''),
              }),
            ],
          })
        )
      })
    }

    children.push(new Paragraph({ text: '' })) // Spacer
  })

  const doc = new Document({
    sections: [{
      children,
    }],
  })

  return await Packer.toBuffer(doc)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format, entryIds, title = 'Understood. Export' } = body as {
      format: ExportFormat
      entryIds?: string[]
      title?: string
    }

    if (!format || !['pdf', 'csv', 'xlsx', 'docx'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Fetch entries
    let query = supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (entryIds && entryIds.length > 0) {
      query = query.in('id', entryIds)
    }

    const { data: entries, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No entries found' }, { status: 404 })
    }

    let data: Buffer | string
    let contentType: string
    let filename: string
    const timestamp = new Date().toISOString().split('T')[0]

    switch (format) {
      case 'pdf':
        data = await generatePDF(entries as Entry[], title)
        contentType = 'application/pdf'
        filename = `personal-press-export-${timestamp}.pdf`
        break

      case 'csv':
        data = generateCSV(entries as Entry[])
        contentType = 'text/csv'
        filename = `personal-press-export-${timestamp}.csv`
        break

      case 'xlsx':
        data = generateXLSX(entries as Entry[])
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `personal-press-export-${timestamp}.xlsx`
        break

      case 'docx':
        data = await generateDOCX(entries as Entry[], title)
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `personal-press-export-${timestamp}.docx`
        break

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Convert data to Uint8Array if it's a Buffer
    const responseData = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : new Uint8Array(data)

    return new NextResponse(responseData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
