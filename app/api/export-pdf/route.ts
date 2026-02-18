import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateEntryPDF as jspdfEntry,
  generateWeeklyPDF as jspdfWeekly,
  generateMultiEntryPDF as jspdfMulti,
} from '@/lib/pdf/generate-pdf-serverless'
import { Entry, WeeklyTheme } from '@/types'

// Headless browser requires Node.js runtime
export const runtime = 'nodejs'

// Allow up to 60s for cold-start Chromium download on Vercel Pro
export const maxDuration = 60

// Feature flag: set PDF_ENGINE=browser in .env.local to use headless browser
const useBrowser = process.env.PDF_ENGINE === 'browser'

async function getGenerators() {
  if (useBrowser) {
    const mod = await import('@/lib/pdf/generate-pdf-browser')
    return {
      generateEntryPDF: mod.generateEntryPDF,
      generateWeeklyPDF: mod.generateWeeklyPDF,
      generateMultiEntryPDF: mod.generateMultiEntryPDF,
    }
  }
  return {
    generateEntryPDF: jspdfEntry,
    generateWeeklyPDF: jspdfWeekly,
    generateMultiEntryPDF: jspdfMulti,
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('PDF export request received')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { generateEntryPDF, generateWeeklyPDF, generateMultiEntryPDF } = await getGenerators()

    const body = await request.json()
    const { type, entryIds, themeId } = body

    let pdfBuffer: Buffer

    if (type === 'entry' && entryIds && entryIds.length === 1) {
      // Single entry PDF
      const { data: entry, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', entryIds[0])
        .eq('user_id', user.id)
        .single()

      if (error || !entry) {
        return NextResponse.json(
          { error: 'Entry not found' },
          { status: 404 }
        )
      }

      pdfBuffer = await generateEntryPDF(entry as Entry)
    } else     if (type === 'weekly' && themeId) {
      // Weekly theme PDF
      console.log('Generating weekly theme PDF for themeId:', themeId)
      const { data: theme, error: themeError } = await supabase
        .from('weekly_themes')
        .select('*')
        .eq('id', themeId)
        .eq('user_id', user.id)
        .single()

      if (themeError || !theme) {
        console.error('Theme error:', themeError)
        return NextResponse.json(
          { error: `Weekly theme not found: ${themeError?.message || 'Unknown error'}` },
          { status: 404 }
        )
      }

      console.log('Theme found:', theme.id)
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .in('id', (theme as WeeklyTheme).entry_ids)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (entriesError) {
        console.error('Entries error:', entriesError)
        return NextResponse.json(
          { error: `Failed to fetch entries: ${entriesError.message}` },
          { status: 500 }
        )
      }

      console.log('Entries found:', entries?.length || 0)
      console.log('Generating PDF...')
      pdfBuffer = await generateWeeklyPDF(theme as WeeklyTheme, entries as Entry[])
      console.log('PDF generated successfully, size:', pdfBuffer.length)
    } else if (type === 'multi' && entryIds && entryIds.length > 0) {
      // Multiple entries PDF
      const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .in('id', entryIds)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch entries' },
          { status: 500 }
        )
      }

      pdfBuffer = await generateMultiEntryPDF(entries as Entry[])
    } else {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}-export-${Date.now()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    
    return NextResponse.json(
      { error: `PDF generation failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}

