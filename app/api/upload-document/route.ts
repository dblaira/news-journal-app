import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createStorageClient } from '@/lib/supabase/storage'
import { addEntryImage } from '@/app/actions/entries'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'
// Increase timeout for PDF processing
export const maxDuration = 60

// Determine file type from MIME type
function getFileTypeFromMime(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType === 'text/csv') return 'csv'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xlsx'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'docx'
  return 'other'
}

// PDF text extraction - using multiple fallback methods
async function extractPdfText(buffer: Buffer): Promise<string> {
  console.log(`📄 Starting PDF extraction, buffer size: ${buffer.length} bytes`)
  
  // Method 1: Try pdf-parse (most reliable in serverless)
  try {
    // Dynamic import with CommonJS fallback handling
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = pdfParseModule.default || pdfParseModule
    
    console.log('📄 pdf-parse module loaded, attempting extraction...')
    const data = await pdfParse(buffer, {
      // Limit pages for faster processing
      max: 10,
    })
    
    if (data.text && data.text.trim().length > 0) {
      console.log(`📄 pdf-parse SUCCESS: ${data.numpages} pages, ${data.text.length} chars`)
      console.log(`📄 First 200 chars: ${data.text.substring(0, 200)}`)
      return data.text
    }
    console.log('📄 pdf-parse returned empty text (PDF may be image-based)')
  } catch (pdfParseError) {
    const errorMsg = pdfParseError instanceof Error ? pdfParseError.message : String(pdfParseError)
    console.error('📄 pdf-parse FAILED:', errorMsg)
    // Log full stack trace for debugging
    if (pdfParseError instanceof Error && pdfParseError.stack) {
      console.error('📄 Stack:', pdfParseError.stack.split('\n').slice(0, 5).join('\n'))
    }
  }

  // Method 2: Fallback to unpdf if pdf-parse fails
  try {
    console.log('📄 Trying unpdf fallback...')
    const { extractText } = await import('unpdf')
    const result = await extractText(new Uint8Array(buffer))
    
    if (result.text && result.text.trim().length > 0) {
      console.log(`📄 unpdf SUCCESS: ${result.totalPages} pages, ${result.text.length} chars`)
      return result.text
    }
    console.log('📄 unpdf returned empty text')
  } catch (unpdfError) {
    const errorMsg = unpdfError instanceof Error ? unpdfError.message : String(unpdfError)
    console.error('📄 unpdf FAILED:', errorMsg)
  }

  console.log('📄 All PDF extraction methods failed - PDF may be scanned/image-based')
  return ''
}

// Excel/CSV text extraction using xlsx (SheetJS)
async function extractExcelText(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const result: string[] = []
    
    // Extract text from each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      // Convert to CSV for readable text
      const csv = XLSX.utils.sheet_to_csv(sheet)
      if (csv.trim()) {
        result.push(`--- Sheet: ${sheetName} ---`)
        result.push(csv)
      }
    }
    
    const text = result.join('\n\n')
    console.log('📊 Excel parsed successfully, text length:', text.length)
    return text
  } catch (error) {
    console.error('Excel parsing error:', error)
    return ''
  }
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
    
    // Get entryId - may be null for FAB flow (entry created after upload)
    const entryId = formData.get('entryId') as string | null
    
    // Support both single file and multiple files upload
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null
    const fileType = formData.get('fileType') as string | null
    
    // Combine files from both sources
    const allFiles: File[] = files.length > 0 ? files : (singleFile ? [singleFile] : [])

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // If entryId provided, verify entry belongs to user
    if (entryId) {
      const { data: entry, error: entryError } = await supabase
        .from('entries')
        .select('id, images')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single()

      if (entryError || !entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }
    }

    const uploadedUrls: { url: string; fileName: string; fileType: string; extractedText?: string }[] = []
    
    // Use storage client with service role key (bypasses RLS)
    const storageClient = createStorageClient()

    for (const file of allFiles) {
      // Get file buffer
      const buffer = Buffer.from(await file.arrayBuffer())
      
      // Determine file type
      const detectedType = fileType || getFileTypeFromMime(file.type)
      
      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const folder = `documents/${detectedType}`
      const filePath = `${user.id}/${folder}/${timestamp}-${sanitizedName}`

      // Upload to Supabase Storage using storage client (service role key bypasses RLS)
      const { data: uploadData, error: uploadError } = await storageClient.storage
        .from('entry-photos') // Reusing existing bucket
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // Continue with other files but log error
        continue
      }

      // Get public URL
      const { data: urlData } = storageClient.storage
        .from('entry-photos')
        .getPublicUrl(filePath)

      // Extract text content for certain file types
      let extractedText: string | null = null

      if (detectedType === 'csv') {
        // Use xlsx to parse CSV (more robust)
        const csvText = await extractExcelText(buffer)
        if (csvText && csvText.trim().length > 0) {
          extractedText = csvText.substring(0, 2000)
          console.log(`📋 CSV extracted ${csvText.length} chars from ${file.name}`)
        } else {
          // Fallback to raw text
          const text = buffer.toString('utf-8')
          const lines = text.split('\n').slice(0, 20)
          extractedText = lines.join('\n')
        }
      } else if (detectedType === 'pdf') {
        // Actually extract PDF text content
        console.log(`📄 Processing PDF: ${file.name}, size: ${(buffer.length / 1024).toFixed(1)}KB`)
        const pdfText = await extractPdfText(buffer)
        if (pdfText && pdfText.trim().length > 0) {
          // Limit to first ~3000 chars for AI processing (allow more context)
          extractedText = pdfText.substring(0, 3000)
          console.log(`📄 PDF extraction SUCCESS: ${pdfText.length} total chars, sending ${extractedText.length} chars from ${file.name}`)
        } else {
          console.log(`📄 PDF extraction FAILED: No text extracted from ${file.name}`)
          extractedText = `PDF document uploaded: ${file.name} (${(buffer.length / 1024).toFixed(1)}KB) - Could not extract text. This may be a scanned image PDF.`
        }
      } else if (detectedType === 'xlsx') {
        // Extract actual Excel content
        const excelText = await extractExcelText(buffer)
        if (excelText && excelText.trim().length > 0) {
          // Limit to first ~2000 chars for AI processing
          extractedText = excelText.substring(0, 2000)
          console.log(`📊 Excel extracted ${excelText.length} chars from ${file.name}`)
        } else {
          extractedText = `Excel spreadsheet: ${file.name} (${(buffer.length / 1024).toFixed(1)}KB) - No data extracted`
        }
      } else if (detectedType === 'docx') {
        extractedText = `Word document: ${file.name} (${(buffer.length / 1024).toFixed(1)}KB)`
      }

      uploadedUrls.push({
        url: urlData.publicUrl,
        fileName: file.name,
        fileType: detectedType,
        extractedText: extractedText || undefined,
      })

      // If entryId provided, add to entry's images array
      if (entryId) {
        const { data: currentEntry } = await supabase
          .from('entries')
          .select('images')
          .eq('id', entryId)
          .single()
        
        const currentImages = currentEntry?.images || []
        await addEntryImage(entryId, urlData.publicUrl, {
          imageType: 'document',
          combinedNarrative: extractedText || `Document: ${file.name}`,
          suggestedTags: [detectedType],
          suggestedEntryType: 'note',
        }, currentImages.length === 0)
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: 'All file uploads failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      uploadedUrls,
      // Legacy single file response format (for FAB capture-input compatibility)
      url: uploadedUrls[0]?.url,
      fileName: uploadedUrls[0]?.fileName,
      fileType: uploadedUrls[0]?.fileType,
      extractedText: uploadedUrls[0]?.extractedText,
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
