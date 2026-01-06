import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EntryType } from '@/types'

export interface InferredEntry {
  headline: string
  subheading: string
  category: 'Business' | 'Finance' | 'Health' | 'Spiritual' | 'Fun' | 'Social' | 'Romance'
  mood: string
  // Unified entry system fields
  entry_type: EntryType
  due_date: string | null
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

    const { content, selectedType } = await request.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const inferred = await inferEntryMetadata(content.trim(), apiKey)

    // If user selected a type, use it instead of AI inference
    if (selectedType && ['story', 'action', 'note'].includes(selectedType)) {
      inferred.entry_type = selectedType as EntryType
      // If user didn't select action, clear due_date
      if (selectedType !== 'action') {
        inferred.due_date = null
      }
    }

    return NextResponse.json(inferred)
  } catch (error) {
    console.error('Error inferring entry:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function inferEntryMetadata(content: string, apiKey: string): Promise<InferredEntry> {
  // Get current date for relative date inference
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const prompt = `You are analyzing a personal journal entry to extract metadata. Based on the following journal entry text, infer:

1. headline: A punchy, newsworthy headline that captures the essence (5-10 words, like a newspaper headline)
2. subheading: Brief context or teaser that adds detail (10-20 words)
3. category: The single best fitting category from EXACTLY one of these options: Business, Finance, Health, Spiritual, Fun, Social, Romance
4. mood: The emotional tone in 1-2 words (e.g., "reflective", "energized", "grateful", "determined")
5. entry_type: Classify as ONE of these:
   - "story": Reflections, experiences, observations, things that happened, feelings, insights, diary entries, narratives about the past
   - "action": USE THIS FOR ANY OF THESE PATTERNS:
     * Lists of things to do (even without "I need to")
     * Imperative verbs: "Buy X", "Call Y", "Find Z", "Get W", "Send V", "Fix U"
     * Words like "task", "tasks", "todo", "to-do", "reminder", "reminders"
     * "Remember to...", "Don't forget...", "Need to...", "Should...", "Must..."
     * Multiple short action-oriented sentences separated by periods or commas
     * Any content that reads like a checklist or task list
   - "note": Facts, references, information to remember, quotes, links, things to look up later, research notes, bookmarks
   
   IMPORTANT: If the text contains multiple actionable items (like "Buy groceries. Call mom. Fix car."), classify as "action" NOT "story".
6. due_date: If entry_type is "action" and a deadline is mentioned or implied, return the date as ISO format (YYYY-MM-DD). Today's date is ${todayStr}. Convert relative dates:
   - "tomorrow" = the day after ${todayStr}
   - "next week" = 7 days from ${todayStr}
   - "by Friday" = the upcoming Friday
   - If no deadline is mentioned, return null

Journal Entry:
"""
${content}
"""

Return ONLY valid JSON with no additional text, markdown, or explanation:
{"headline": "...", "subheading": "...", "category": "...", "mood": "...", "entry_type": "...", "due_date": "..." or null}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
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
    } catch {
      bodyText = '<unable to read response body>'
    }
    throw new Error(`API request failed: ${response.status} - ${bodyText}`)
  }

  const data = await response.json()
  
  // Validate response structure
  if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
    throw new Error('Invalid API response: missing content array')
  }
  
  const firstContent = data.content[0]
  if (!firstContent || typeof firstContent.text !== 'string') {
    throw new Error('Invalid API response: missing text in content')
  }
  
  const text = firstContent.text.trim()

  // Parse JSON response
  try {
    const parsed = JSON.parse(text)
    
    // Validate category
    const validCategories = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']
    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'Fun' // Default fallback
    }

    // Validate entry_type
    const validEntryTypes: EntryType[] = ['story', 'action', 'note']
    const entryType: EntryType = validEntryTypes.includes(parsed.entry_type) 
      ? parsed.entry_type 
      : 'story' // Default to story if not recognized

    // Validate and parse due_date
    let dueDate: string | null = null
    if (parsed.due_date && entryType === 'action') {
      // Validate ISO date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(parsed.due_date)) {
        dueDate = parsed.due_date
      }
    }

    return {
      headline: parsed.headline || 'Untitled Entry',
      subheading: parsed.subheading || '',
      category: parsed.category,
      mood: parsed.mood || 'reflective',
      entry_type: entryType,
      due_date: dueDate,
    }
  } catch {
    // If JSON parsing fails, create defaults
    console.error('Failed to parse AI response:', text)
    return {
      headline: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      subheading: '',
      category: 'Fun',
      mood: 'reflective',
      entry_type: 'story',
      due_date: null,
    }
  }
}

