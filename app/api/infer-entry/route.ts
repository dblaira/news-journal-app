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

    // Only override AI inference if user EXPLICITLY selected a type
    // selectedType will be null if user didn't touch the dropdown
    if (selectedType && ['story', 'action', 'note'].includes(selectedType)) {
      inferred.entry_type = selectedType as EntryType
      // If user explicitly chose non-action type, clear due_date
      if (selectedType !== 'action') {
        inferred.due_date = null
      }
    }
    // Otherwise, trust the AI inference (which now has improved action detection)

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
  
  // Calculate common relative dates
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]
  
  const prompt = `You are a journal entry classifier that excels at detecting ACTIONABLE INTENT. Your primary job is to identify when someone is capturing something they need to DO, even if they phrase it conversationally.

CRITICAL: Many users write actions in a narrative style. "I should really call mom" IS an action, not a story. When in doubt, lean toward "action".

## Classification Rules

### entry_type - Choose ONE:

**"action"** - USE THIS IF ANY OF THESE ARE TRUE:
- FUTURE INTENT: "I need to", "I should", "I have to", "I want to", "I'm going to", "gonna", "gotta", "planning to", "thinking about doing"
- IMPERATIVE/COMMAND: "Buy X", "Call Y", "Email Z", "Schedule W", "Fix", "Get", "Send", "Check", "Look into", "Research"
- TASK LANGUAGE: "task", "todo", "to-do", "reminder", "checklist", "errand", "appointment"
- OBLIGATION: "Remember to", "Don't forget", "Need to", "Must", "Have to", "Should"
- DEADLINE MENTIONS: "by Friday", "tomorrow", "next week", "before the meeting", "ASAP", "soon", "this week"
- QUESTIONS ABOUT DOING: "Should I...?", "When should I...?", "How do I...?"
- EMBEDDED ACTIONS: Even if most content is narrative, if there's ONE actionable item, classify as "action"
- FUTURE TENSE ACTIVITIES: "Going to the gym tomorrow" = action, "Went to the gym today" = story
- LISTS OF ANY KIND: Multiple items separated by commas, periods, or line breaks that could be a checklist

**"story"** - USE ONLY FOR:
- Pure PAST TENSE reflections about what happened
- Feelings and observations about completed events
- Diary entries with NO forward-looking action items
- NO mention of things that need to be done

**"note"** - USE FOR:
- Information storage: facts, quotes, links, references
- Research notes and bookmarks
- Things to remember that aren't tasks (phone numbers, ideas, definitions)
- "Note to self" that's informational, not actionable

## Examples of ACTIONS (often misclassified as stories):

INPUT: "I should really call my mom this weekend"
OUTPUT: "action" (future intent + obligation language)

INPUT: "Thinking I might sign up for that pottery class"
OUTPUT: "action" (future intent, even tentative)

INPUT: "Had a great meeting today. Need to follow up with Sarah about the proposal."
OUTPUT: "action" (embedded action at the end)

INPUT: "Feeling tired but I know I should hit the gym tomorrow"
OUTPUT: "action" (future commitment)

INPUT: "Buy milk, eggs, bread"
OUTPUT: "action" (imperative list)

INPUT: "Doctor's appointment at 3pm Tuesday"
OUTPUT: "action" (scheduled event requiring attendance)

INPUT: "Look into flights for December trip"
OUTPUT: "action" (research task)

## Examples of STORIES (truly no action):

INPUT: "Had the best coffee with Jane today. We talked for hours."
OUTPUT: "story" (past tense, no future action)

INPUT: "Feeling grateful for my family after the holiday gathering"
OUTPUT: "story" (reflection, no action)

## Other Fields:

1. **headline**: Punchy, newsworthy headline (5-10 words). For actions, make it task-oriented: "Time to Schedule That Doctor Visit"
2. **subheading**: Brief context (10-20 words)
3. **category**: Business | Finance | Health | Spiritual | Fun | Social | Romance
4. **mood**: Emotional tone in 1-2 words
5. **due_date**: For actions with deadlines. Today is ${todayStr}.
   - "today" = ${todayStr}
   - "tomorrow" = ${tomorrowStr}
   - "next week" = ${nextWeekStr}
   - "this weekend" = upcoming Saturday
   - No deadline mentioned = null

## Input:
"""
${content}
"""

Return ONLY valid JSON:
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

