import { Entry } from '@/types'

export function createWeeklyThemePrompt(entries: Entry[]): string {
  const entriesText = entries
    .map((entry, index) => {
      return `Entry ${index + 1}:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}
Content: ${entry.content}
---`
    })
    .join('\n\n')

  return `Analyze these 7 journal entries from the past week and identify the unifying themes, patterns, and emotional arcs that connect them. Generate a compelling weekly theme that captures the essence of this week's journey.

${entriesText}

Based on these entries, provide:
1. A compelling headline (like a news feature headline) that captures the unifying theme
2. A subtitle that expands on the theme with depth and insight
3. A detailed theme analysis (2-3 paragraphs) that explores the connections, patterns, and deeper meaning across these entries

Return your response as JSON in this exact format:
{
  "headline": "Your compelling headline here",
  "subtitle": "Your insightful subtitle here",
  "theme_content": "Your detailed analysis here (2-3 paragraphs)"
}

Write ONLY the JSON object, no preamble or explanation.`
}

export function parseWeeklyThemeResponse(response: string): {
  headline: string
  subtitle: string
  theme_content: string
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        headline: parsed.headline || '',
        subtitle: parsed.subtitle || '',
        theme_content: parsed.theme_content || '',
      }
    }
    throw new Error('No JSON found in response')
  } catch (error) {
    // Fallback: parse manually if JSON parsing fails
    const lines = response.split('\n').filter((line) => line.trim())
    return {
      headline: lines[0] || 'Weekly Reflection',
      subtitle: lines[1] || 'A week of meaningful moments',
      theme_content: lines.slice(2).join('\n') || response,
    }
  }
}

