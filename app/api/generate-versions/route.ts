import { NextRequest, NextResponse } from 'next/server'
import { Entry } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { entry }: { entry: Entry } = await request.json()

    if (!entry || !entry.content) {
      return NextResponse.json(
        { error: 'Entry content is required' },
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

    // Generate all 3 versions
    const versions = await generateAllVersions(entry, apiKey)

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function generateAllVersions(entry: Entry, apiKey: string) {
  const styles = [
    {
      name: 'literary',
      title: 'Literary/Personal Essay',
      prompt: createLiteraryPrompt(entry),
    },
    {
      name: 'news',
      title: 'News Feature',
      prompt: createNewsPrompt(entry),
    },
    {
      name: 'poetic',
      title: 'Poetic',
      prompt: createPoeticPrompt(entry),
    },
  ]

  const results = await Promise.all(
    styles.map(async (style) => {
      const content = await callClaudeAPI(style.prompt, apiKey)
      
      // Parse structured JSON response for news style
      if (style.name === 'news') {
        try {
          // Clean potential markdown code fences
          const cleanedContent = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()
          
          const parsed = JSON.parse(cleanedContent)
          return {
            name: style.name,
            title: style.title,
            content: `${parsed.headline}\n\n${parsed.body}`, // Fallback combined content
            headline: parsed.headline,
            body: parsed.body,
          }
        } catch (e) {
          // Fallback if JSON parsing fails - use content as-is
          console.error('Failed to parse news JSON:', e)
          return {
            name: style.name,
            title: style.title,
            content: content,
          }
        }
      }
      
      return {
        name: style.name,
        title: style.title,
        content: content,
      }
    })
  )

  return results
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

function createPoeticPrompt(entry: Entry): string {
  return `Transform this journal entry into a poetic style. Use evocative imagery, rhythm, and carefully chosen language. Make it feel contemplative and artistic without being fragmented or disjointed.

Entry:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

IMPORTANT FORMATTING RULES:
- Write ONLY the poetic version
- Do NOT include a title, heading, or any introductory line
- Do NOT use markdown formatting (no asterisks, no bold, no italics)
- Do NOT use decorative symbols or ornaments
- Start directly with the first line of poetry/prose
- Use plain text only`
}

function createNewsPrompt(entry: Entry): string {
  return `Rewrite this journal entry as a compelling news feature article in the style of the New York Times. Use journalistic structure and make it feel significant. IMPORTANT: Only include facts and details that are explicitly present in the original entry—do not invent quotes, statistics, or embellish with fabricated details.

Entry:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

Return your response as valid JSON with this exact structure:
{
  "headline": "Your compelling news headline here",
  "body": "The full article body text here"
}

Write ONLY the JSON object. No preamble, explanation, or markdown formatting.`
}

function createLiteraryPrompt(entry: Entry): string {
  return `Rewrite this journal entry as a literary personal essay. Make it thoughtful, introspective, and beautifully written. Keep metaphors sparse so each one carries more weight. Explore the deeper meanings and universal themes with a lean, economical prose style.

Entry:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

IMPORTANT FORMATTING RULES:
- Write ONLY the essay body text
- Do NOT include a title, heading, or any introductory line
- Do NOT use markdown formatting (no asterisks, no bold, no italics)
- Do NOT use decorative symbols or ornaments
- Start directly with the first sentence of prose
- Use plain text only`
}

