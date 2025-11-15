import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEntryPDF, generateWeeklyPDF, generateMultiEntryPDF } from '@/lib/pdf/generate-pdf.server'
import { Entry, WeeklyTheme } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    } else if (type === 'weekly' && themeId) {
      // Weekly theme PDF
      const { data: theme, error: themeError } = await supabase
        .from('weekly_themes')
        .select('*')
        .eq('id', themeId)
        .eq('user_id', user.id)
        .single()

      if (themeError || !theme) {
        return NextResponse.json(
          { error: 'Weekly theme not found' },
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
          { error: 'Failed to fetch entries' },
          { status: 500 }
        )
      }

      pdfBuffer = await generateWeeklyPDF(theme as WeeklyTheme, entries as Entry[])
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

