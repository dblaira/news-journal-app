import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildExtractionPrompt, parseExtractionResponse, callExtractionAPI } from '@/lib/ai/extraction-prompt'
import { ExtractionBatchResult } from '@/types/extraction'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const entryIds: string[] | undefined = body.entryIds

    // Fetch entries — only the content field (guaranteed human-authored)
    let query = supabase
      .from('entries')
      .select('id, content, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (entryIds && entryIds.length > 0) {
      query = query.in('id', entryIds)
    }

    const { data: entries, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching entries:', fetchError)
      return NextResponse.json(
        { error: `Failed to fetch entries: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        batch_id: null,
        total_entries_processed: 0,
        total_extractions_found: 0,
        categories_found: [],
        extraction_ids: [],
        message: 'No entries to process',
      })
    }

    // Filter out entries that already have extractions (unless specific IDs were requested)
    let entriesToProcess = entries
    if (!entryIds) {
      const { data: existingExtractions } = await supabase
        .from('extractions')
        .select('entry_id')
        .eq('user_id', user.id)

      const alreadyExtracted = new Set(
        (existingExtractions || []).map((e: { entry_id: string }) => e.entry_id)
      )
      entriesToProcess = entries.filter(e => !alreadyExtracted.has(e.id))

      if (entriesToProcess.length === 0) {
        return NextResponse.json({
          batch_id: null,
          total_entries_processed: 0,
          total_extractions_found: 0,
          categories_found: [],
          extraction_ids: [],
          message: `All ${entries.length} entries already extracted`,
        })
      }
    }

    // Group entries by calendar day
    const dayGroups = new Map<string, typeof entriesToProcess>()
    for (const entry of entriesToProcess) {
      const day = entry.created_at.split('T')[0]
      if (!dayGroups.has(day)) {
        dayGroups.set(day, [])
      }
      dayGroups.get(day)!.push(entry)
    }

    const batchId = crypto.randomUUID()
    const allExtractionIds: string[] = []
    const allCategories = new Set<string>()
    let totalExtractionsFound = 0
    const days = Array.from(dayGroups.keys()).sort()

    console.log(`=== Extraction Pipeline START ===`)
    console.log(`Batch ID: ${batchId}`)
    console.log(`Entries to process: ${entriesToProcess.length}`)
    console.log(`Day groups: ${days.length}`)

    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      const dayEntries = dayGroups.get(day)!

      console.log(`\n--- Day ${i + 1}/${days.length}: ${day} (${dayEntries.length} entries) ---`)

      const prompt = buildExtractionPrompt(dayEntries)

      try {
        const responseText = await callExtractionAPI(prompt, apiKey)
        const extractions = parseExtractionResponse(responseText)

        console.log(`Extractions found: ${extractions.length}`)

        if (extractions.length > 0) {
          // Validate entry_ids match entries we sent
          const validEntryIds = new Set(dayEntries.map(e => e.id))
          const validExtractions = extractions.filter(ext => {
            if (!validEntryIds.has(ext.entry_id)) {
              console.warn(`Dropping extraction with unknown entry_id: ${ext.entry_id}`)
              return false
            }
            return true
          })

          if (validExtractions.length > 0) {
            const rows = validExtractions.map(ext => ({
              user_id: user.id,
              entry_id: ext.entry_id,
              category: ext.category,
              data: ext.data,
              confidence: ext.confidence,
              source_text: ext.source_text || null,
              batch_id: batchId,
            }))

            const { data: inserted, error: insertError } = await supabase
              .from('extractions')
              .insert(rows)
              .select('id')

            if (insertError) {
              console.error(`Insert error for day ${day}:`, insertError)
            } else if (inserted) {
              const ids = inserted.map((r: { id: string }) => r.id)
              allExtractionIds.push(...ids)
              totalExtractionsFound += ids.length
              validExtractions.forEach(ext => allCategories.add(ext.category))
              console.log(`Inserted ${ids.length} extractions`)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing day ${day}:`, error)
      }

      // 2s delay between API calls to avoid rate limiting
      if (i < days.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const result: ExtractionBatchResult = {
      batch_id: batchId,
      total_entries_processed: entriesToProcess.length,
      total_extractions_found: totalExtractionsFound,
      categories_found: Array.from(allCategories).sort(),
      extraction_ids: allExtractionIds,
    }

    console.log(`\n=== Extraction Pipeline END ===`)
    console.log(`Result:`, JSON.stringify(result, null, 2))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Extraction pipeline error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
