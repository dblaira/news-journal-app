import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateEntryPDF as jspdfEntry,
  generateWeeklyPDF as jspdfWeekly,
  generateMultiEntryPDF as jspdfMulti,
} from '@/lib/pdf/generate-pdf-serverless'
import { Entry, WeeklyTheme } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const useBrowser = process.env.PDF_ENGINE === 'browser'

type GenerateFn<T extends unknown[]> = (...args: T) => Promise<Buffer>

function withFallback<T extends unknown[]>(
  browserFn: GenerateFn<T>,
  jspdfFn: GenerateFn<T>,
): GenerateFn<T> {
  return async (...args: T) => {
    try {
      return await browserFn(...args)
    } catch (err) {
      console.warn('Browser PDF generation failed, retrying with jsPDF:', err)
      return jspdfFn(...args)
    }
  }
}

async function getGenerators() {
  if (useBrowser) {
    try {
      const mod = await import('@/lib/pdf/generate-pdf-browser')
      return {
        generateEntryPDF: withFallback(mod.generateEntryPDF, jspdfEntry),
        generateWeeklyPDF: withFallback(mod.generateWeeklyPDF, jspdfWeekly),
        generateMultiEntryPDF: withFallback(mod.generateMultiEntryPDF, jspdfMulti),
      }
    } catch (err) {
      console.warn('Browser PDF engine failed to load, falling back to jsPDF:', err)
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
    } else if (type === 'weekly' && themeId) {
      const { data: theme, error: themeError } = await supabase
        .from('weekly_themes')
        .select('*')
        .eq('id', themeId)
        .eq('user_id', user.id)
        .single()

      if (themeError || !theme) {
        return NextResponse.json(
          { error: `Weekly theme not found: ${themeError?.message || 'Unknown error'}` },
          { status: 404 }
        )
      }

      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .in('id', (theme as WeeklyTheme).entry_ids)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (entriesError) {
        return NextResponse.json(
          { error: `Failed to fetch entries: ${entriesError.message}` },
          { status: 500 }
        )
      }

      pdfBuffer = await generateWeeklyPDF(theme as WeeklyTheme, entries as Entry[])
    } else if (type === 'multi' && entryIds && entryIds.length > 0) {
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
    return NextResponse.json(
      { error: `PDF generation failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}
