import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Entry } from '@/types'
import { createWeeklyThemePrompt, parseWeeklyThemeResponse } from '@/lib/ai/weekly-theme-prompt'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryIds }: { entryIds: string[] } = await request.json()

    if (!entryIds || entryIds.length !== 7) {
      return NextResponse.json(
        { error: 'Exactly 7 entry IDs are required' },
        { status: 400 }
      )
    }

    // Fetch all 7 entries (user-scoped)
    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('*')
      .in('id', entryIds)
      .eq('user_id', user.id)

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch entries: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!entries || entries.length !== 7) {
      return NextResponse.json(
        { error: 'Could not find all 7 entries' },
        { status: 404 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Generate weekly theme using Claude API
    const prompt = createWeeklyThemePrompt(entries as Entry[])
    const response = await callClaudeAPI(prompt, apiKey)
    const theme = parseWeeklyThemeResponse(response)

    // Calculate week start date (Monday of the week)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
    const weekStart = new Date(now.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)

    // Store weekly theme in database
    const { data: themeData, error: insertError } = await supabase
      .from('weekly_themes')
      .insert([
        {
          user_id: user.id,
          headline: theme.headline,
          subtitle: theme.subtitle,
          theme_content: theme.theme_content,
          entry_ids: entryIds,
          week_start_date: weekStart.toISOString().split('T')[0],
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting weekly theme:', insertError)
      return NextResponse.json(
        { error: `Failed to save theme: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Update entries with week_theme_id
    const { error: updateError } = await supabase
      .from('entries')
      .update({ week_theme_id: themeData.id })
      .in('id', entryIds)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating entries:', updateError)
      // Don't fail the request, theme was created successfully
    }

    return NextResponse.json({ theme: themeData })
  } catch (error) {
    console.error('Error generating weekly theme:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function callClaudeAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    let bodyText: string
    try {
      bodyText = await response.text()
    } catch (e) {
      bodyText = '<unable to read response body>'
    }
    throw new Error(`API request failed: ${response.status} - ${bodyText}`)
  }

  const data = await response.json()
  return data.content[0].text
}

