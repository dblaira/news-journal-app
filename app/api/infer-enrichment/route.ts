// app/api/infer-enrichment/route.ts

import { NextResponse } from 'next/server'

const ENRICHMENT_SYSTEM_PROMPT = `You analyze journal entries to infer context about when and how they were written.

Given the entry content and optional context (time of day, location), infer:
1. Activity - What was the person likely doing? (e.g., "after workout", "during commute", "at work", "morning coffee", "winding down")
2. Energy - Their energy level: "low", "medium", or "high"
3. Mood - 1-3 mood words that fit (e.g., "focused", "reflective", "anxious", "calm", "energized", "playful")
4. Environment - Where they likely were (e.g., "home office", "coffee shop", "car", "bed", "outside")
5. Trigger - What likely prompted this thought (e.g., "conversation", "article I read", "random thought", "work situation")

Output valid JSON only:
{
  "activity": "string or null",
  "energy": "low" | "medium" | "high" | null,
  "mood": ["array", "of", "moods"] or null,
  "environment": "string or null",
  "trigger": "string or null"
}

Be specific but concise. If you can't confidently infer something, use null.`

export async function POST(request: Request) {
  try {
    const { content, timeOfDay, dayOfWeek, location } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Build context string
    let contextInfo = ''
    if (timeOfDay) contextInfo += `Time of day: ${timeOfDay}\n`
    if (dayOfWeek) contextInfo += `Day: ${dayOfWeek}\n`
    if (location) contextInfo += `Location: ${location}\n`

    const userPrompt = `${contextInfo ? `Context:\n${contextInfo}\n` : ''}Entry content:
"${content.slice(0, 2000)}"

Infer the activity, energy, mood, environment, and trigger for this journal entry.`

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
        system: ENRICHMENT_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'AI inference failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const textContent = data.content?.[0]

    if (textContent?.type === 'text') {
      // Extract JSON from response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const inferred = JSON.parse(jsonMatch[0])
        return NextResponse.json(inferred)
      }
    }

    return NextResponse.json(
      { error: 'Failed to parse inference' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Enrichment inference error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Inference failed' },
      { status: 500 }
    )
  }
}

