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
  connection_type: string | null
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

    const { content, selectedType, documentContent } = await request.json()

    console.log('🤖 infer-entry received:', {
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) || 'none',
      selectedType,
      hasDocumentContent: !!documentContent,
      documentContentLength: documentContent?.length || 0,
      documentContentPreview: documentContent?.substring(0, 200) || 'none'
    })

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

    console.log('🤖 Calling AI with:', {
      contentLength: content.trim().length,
      hasDocumentContent: !!documentContent,
      documentContentLength: documentContent?.length || 0
    })

    const inferred = await inferEntryMetadata(content.trim(), apiKey, documentContent)

    // SAFETY NET: If AI returned "story" but content has obvious action patterns, override
    // Skip override for connections — short declarative statements can look like imperatives
    if (inferred.entry_type === 'story') {
      const actionOverride = detectObviousActionPatterns(content.trim())
      if (actionOverride) {
        console.log('[infer-entry] AI said story, but heuristic detected action patterns')
        inferred.entry_type = 'action'
      }
    }

    // Only override AI inference if user EXPLICITLY selected a type
    // selectedType will be null if user didn't touch the dropdown
    if (selectedType && ['story', 'action', 'note', 'connection'].includes(selectedType)) {
      inferred.entry_type = selectedType as EntryType
      // If user explicitly chose non-action type, clear due_date
      if (selectedType !== 'action') {
        inferred.due_date = null
      }
      // If user explicitly chose non-connection type, clear connection_type
      if (selectedType !== 'connection') {
        inferred.connection_type = null
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

async function inferEntryMetadata(content: string, apiKey: string, documentContent?: string): Promise<InferredEntry> {
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

  // Build document context section if documents were attached
  const documentSection = documentContent ? `
## ATTACHED DOCUMENT(S) - EXTRACTED TEXT:
The user has uploaded document(s). Analyze this extracted text to understand context:
"""
${documentContent}
"""

DOCUMENT ANALYSIS GUIDELINES:
- **Receipts/Invoices**: Typically "Finance" category. Could be "note" (record keeping) or "action" (if user might want to track, return, or follow up)
- **Contracts/Agreements**: Typically "Business" category, often "action" (deadlines, signatures needed)
- **Medical docs**: "Health" category
- **Financial statements**: "Finance" category, usually "note"
- Create a headline that summarizes the document content meaningfully
- If it's a purchase receipt, include the vendor and total in headline (e.g., "Amazon Order: $22.85 - Allergy Meds & Water")
- If user added notes, consider if they're tagging this as something to track (impulse buy, need to return, etc.)

` : ''

  const prompt = `You are a journal entry classifier. Your #1 job is detecting ACTIONABLE INTENT.
${documentSection}

## CRITICAL RULES - READ CAREFULLY:

1. **DEFAULT TO "action"** - If there's ANY doubt, choose "action". Users use this app to capture tasks.
2. **Imperative verbs = action** - Any sentence starting with a verb (Research, Take, Buy, Call, Fix, Get, Send, Check, Schedule, Find, Make, Do, Review, Update, Follow, Remember) is ALWAYS an action.
3. **Multiple sentences with periods = likely action list** - "Do X. Do Y. Do Z." is a task list, not a story.
4. **"Remember to" = action** - This is ALWAYS an action, never a story.

## entry_type Classification:

**"action"** - USE THIS IF ANY OF THESE PATTERNS APPEAR:
- Starts with imperative verb: Research, Take, Buy, Call, Fix, Get, Send, Check, Schedule, Find, Make, Do, Review, Update, Follow up, Look into, Set up, Sign up, Write, Read, Watch, Listen, Try, Test, Finish, Complete, Submit, Pay, Book, Order, Pick up, Drop off, Clean, Organize, Plan, Prepare, Practice, Exercise, Work out, Meditate, Stretch
- Contains: "Remember to", "Don't forget", "Need to", "Have to", "Should", "Must", "Want to", "Going to", "Will", "Gonna", "Gotta"
- Future activities: gym, workout, appointment, meeting, call, email, errand
- Task words: task, tasks, todo, to-do, reminder, checklist
- Multiple short imperative sentences separated by periods
- Anything that could reasonably be a to-do item

**"story"** - USE ONLY WHEN ALL OF THESE ARE TRUE:
- 100% past tense reflection
- ZERO imperative verbs
- ZERO future obligations
- ZERO "remember to" or "need to" phrases
- Pure diary-style "what happened" content

**"note"** - USE FOR:
- Pure information storage (facts, quotes, links, references)
- NOT tasks, NOT things to do

**"connection"** - USE FOR:
- A distilled truth, principle, or identity statement
- Short and declarative (typically under ~50 words)
- Reads as wisdom, a mantra, or a pattern interrupt rather than narrative
- Often imperative or present-tense
- Examples: "Am I building a system or doing a task?", "Feelings aren't facts.", "Work on what I can. Figure out the rest later.", "Anything that gives me a feeling of momentum is worthwhile."
- NOT a story, NOT a task, NOT reference material — it's a belief or principle

## Examples - MEMORIZE THESE:

INPUT: "Research Grok Tasks. Take supplements."
OUTPUT: "action" (imperative verbs: Research, Take)

INPUT: "Take a moment to breathe at noon today. Remember to hold your breath at 1pm."
OUTPUT: "action" (imperative verb: Take, plus "Remember to")

INPUT: "Buy groceries. Call mom. Fix the car."
OUTPUT: "action" (imperative list)

INPUT: "I should really call my mom this weekend"
OUTPUT: "action" (obligation: should)

INPUT: "Thinking I might sign up for that pottery class"
OUTPUT: "action" (future intent)

INPUT: "Had a great meeting today. Need to follow up with Sarah."
OUTPUT: "action" (embedded "Need to")

INPUT: "Gym tomorrow"
OUTPUT: "action" (future activity)

INPUT: "Doctor's appointment Tuesday"
OUTPUT: "action" (scheduled event)

INPUT: "Look into flights for December"
OUTPUT: "action" (imperative: Look into)

## Examples of STORIES (truly no action):

INPUT: "Had the best coffee with Jane today. We talked for hours."
OUTPUT: "story" (100% past tense, no tasks)

INPUT: "Feeling grateful for my family after the holiday gathering"
OUTPUT: "story" (pure reflection, no tasks)

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

6. **connection_type** (only if entry_type is "connection", otherwise null):
   - "identity_anchor" — reconnect with a settled version of yourself
   - "pattern_interrupt" — force a zoom-out when in the weeds
   - "validated_principle" — a conclusion earned through experience
   - "process_anchor" — a specific sequence for a specific situation

Return ONLY valid JSON:
{"headline": "...", "subheading": "...", "category": "...", "mood": "...", "entry_type": "...", "due_date": "..." or null, "connection_type": "..." or null}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
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
  
  let text = firstContent.text.trim()
  
  // Strip markdown code blocks if present (AI sometimes wraps JSON in ```json ... ```)
  if (text.startsWith('```')) {
    // Remove opening ```json or ``` and closing ```
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  // Parse JSON response
  try {
    const parsed = JSON.parse(text)
    
    // Validate category
    const validCategories = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']
    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'Fun' // Default fallback
    }

    // Validate entry_type
    const validEntryTypes: EntryType[] = ['story', 'action', 'note', 'connection']
    const entryType: EntryType = validEntryTypes.includes(parsed.entry_type) 
      ? parsed.entry_type 
      : 'story' // Default to story if not recognized

    // Validate connection_type
    const validConnectionTypes = ['identity_anchor', 'pattern_interrupt', 'validated_principle', 'process_anchor']
    const connectionType = (entryType === 'connection' && validConnectionTypes.includes(parsed.connection_type))
      ? parsed.connection_type
      : null

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
      connection_type: connectionType,
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
      connection_type: null,
    }
  }
}

// Heuristic safety net to catch obvious action patterns the AI might miss
function detectObviousActionPatterns(content: string): boolean {
  const lowerContent = content.toLowerCase()
  
  // Common imperative verbs that start sentences (action indicators)
  const imperativeVerbs = [
    'take', 'research', 'call', 'buy', 'get', 'send', 'email', 'text', 'message',
    'schedule', 'book', 'order', 'pick up', 'drop off', 'fix', 'repair', 'clean',
    'organize', 'find', 'look into', 'check', 'review', 'update', 'finish',
    'complete', 'submit', 'pay', 'sign up', 'register', 'cancel', 'return',
    'make', 'do', 'go to', 'visit', 'meet', 'attend', 'follow up', 'reach out',
    'contact', 'remind', 'remember to', 'don\'t forget', 'need to', 'have to',
    'should', 'must', 'workout', 'exercise', 'meditate', 'practice', 'study',
    'read', 'watch', 'listen', 'try', 'test', 'write', 'plan', 'prepare'
  ]
  
  // Check if content starts with an imperative verb
  for (const verb of imperativeVerbs) {
    if (lowerContent.startsWith(verb)) {
      return true
    }
  }
  
  // Check for multiple sentences that start with imperative verbs
  // Split by period, exclamation, or newline
  const sentences = content.split(/[.!?\n]+/).filter(s => s.trim())
  let imperativeCount = 0
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase()
    for (const verb of imperativeVerbs) {
      if (trimmed.startsWith(verb)) {
        imperativeCount++
        break
      }
    }
  }
  
  // If 2+ sentences start with imperative verbs, it's definitely an action list
  if (imperativeCount >= 2) {
    return true
  }
  
  // Check for "remember to" or "don't forget" anywhere in the content
  if (lowerContent.includes('remember to') || lowerContent.includes("don't forget") || lowerContent.includes('dont forget')) {
    return true
  }
  
  // Check for task-like words
  if (lowerContent.includes('todo') || lowerContent.includes('to-do') || lowerContent.includes('task')) {
    return true
  }
  
  return false
}

