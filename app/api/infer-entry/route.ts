import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface InferredEntry {
  headline: string
  subheading: string
  category: 'Business' | 'Finance' | 'Health' | 'Spiritual' | 'Fun' | 'Social' | 'Romance'
  mood: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

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
  const prompt = `You are analyzing a personal journal entry to extract metadata. Based on the following journal entry text, infer:

1. headline: A punchy, newsworthy headline that captures the essence (5-10 words, like a newspaper headline)
2. subheading: Brief context or teaser that adds detail (10-20 words)
3. category: The single best fitting category from EXACTLY one of these options: Business, Finance, Health, Spiritual, Fun, Social, Romance
4. mood: The emotional tone in 1-2 words (e.g., "reflective", "energized", "grateful", "determined")

Journal Entry:
"""
${content}
"""

Return ONLY valid JSON with no additional text, markdown, or explanation:
{"headline": "...", "subheading": "...", "category": "...", "mood": "..."}`

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
  const text = data.content[0].text.trim()

  // Parse JSON response
  try {
    const parsed = JSON.parse(text)
    
    // Validate category
    const validCategories = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']
    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'Fun' // Default fallback
    }

    return {
      headline: parsed.headline || 'Untitled Entry',
      subheading: parsed.subheading || '',
      category: parsed.category,
      mood: parsed.mood || 'reflective',
    }
  } catch {
    // If JSON parsing fails, create defaults
    console.error('Failed to parse AI response:', text)
    return {
      headline: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      subheading: '',
      category: 'Fun',
      mood: 'reflective',
    }
  }
}

