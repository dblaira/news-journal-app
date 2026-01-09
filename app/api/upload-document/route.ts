import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// File type to folder mapping
const FILE_TYPE_FOLDERS: Record<string, string> = {
  pdf: 'documents/pdf',
  csv: 'documents/csv',
  xlsx: 'documents/xlsx',
  docx: 'documents/docx',
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('fileType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const folder = FILE_TYPE_FOLDERS[fileType] || 'documents/other'
    const filePath = `${user.id}/${folder}/${timestamp}-${sanitizedName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('entry-photos') // Reusing existing bucket, could create new one for documents
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('entry-photos')
      .getPublicUrl(filePath)

    // Extract text content for certain file types
    let extractedText: string | null = null

    if (fileType === 'csv') {
      // Simple CSV text extraction (first few rows)
      try {
        const text = buffer.toString('utf-8')
        const lines = text.split('\n').slice(0, 10) // First 10 rows
        extractedText = lines.join('\n')
      } catch (e) {
        console.log('CSV extraction failed:', e)
      }
    }

    // For PDF, XLSX, DOCX - we'd need additional libraries
    // For now, just store the file and note that extraction is available
    if (fileType === 'pdf') {
      extractedText = `PDF document: ${file.name} (${(buffer.length / 1024).toFixed(1)}KB)`
    }
    if (fileType === 'xlsx') {
      extractedText = `Excel spreadsheet: ${file.name} (${(buffer.length / 1024).toFixed(1)}KB)`
    }
    if (fileType === 'docx') {
      extractedText = `Word document: ${file.name} (${(buffer.length / 1024).toFixed(1)}KB)`
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName: file.name,
      fileType,
      fileSize: buffer.length,
      extractedText,
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
