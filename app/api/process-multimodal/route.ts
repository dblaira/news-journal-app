// app/api/process-multimodal/route.ts

import { NextResponse } from 'next/server'

const VISION_SYSTEM_PROMPT = `You extract structured data from images and combine it with user context.

Analyze the image and output valid JSON only. No other text.

Image types to detect:
- "order": Online order screenshots (Amazon, etc.)
- "receipt": Physical or digital receipts
- "media": Book covers, movie posters, article screenshots
- "travel": Flight/hotel confirmations, reservations
- "screenshot": General app/web screenshots
- "photo": Camera photos of objects, places, people
- "document": Documents, notes, PDFs
- "unknown": Cannot determine

Output schema:
{
  "imageType": "order" | "receipt" | "media" | "travel" | "screenshot" | "photo" | "document" | "unknown",
  "summary": "1-2 sentence summary of image + user context",
  "purchase": {
    "productName": "string",
    "price": number,
    "currency": "USD",
    "seller": "string",
    "orderDate": "YYYY-MM-DD or null",
    "orderId": "string or null",
    "category": "electronics | home | clothing | food | health | entertainment | other"
  } | null,
  "receipt": {
    "merchant": "string",
    "total": number,
    "currency": "USD",
    "date": "YYYY-MM-DD",
    "items": [{"name": "string", "price": number}] | null
  } | null,
  "media": {
    "title": "string",
    "author": "string or null",
    "type": "book | movie | article | podcast | other"
  } | null,
  "travel": {
    "type": "flight | hotel | reservation | other",
    "confirmationNumber": "string or null",
    "date": "YYYY-MM-DD or null",
    "destination": "string or null"
  } | null,
  "extractedText": "Key text from image if relevant",
  "suggestedTags": ["tag1", "tag2"],
  "suggestedEntryType": "story" | "action" | "note",
  "combinedNarrative": "Natural language entry combining what you see with what the user said. Write in first person as if the user wrote it. 2-4 sentences."
}

Rules:
1. Only populate ONE of: purchase, receipt, media, travel (based on imageType). Set others to null.
2. If user provides emotional context ("not sure if I needed this"), incorporate it into combinedNarrative.
3. For prices, extract the number only (no currency symbols).
4. suggestedEntryType: use "story" for reflective content, "action" for todos/follow-ups, "note" for reference info.
5. Keep combinedNarrative concise but include both factual (from image) and emotional (from user) content.`

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType, userText } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const userPrompt = userText
      ? `User's note about this image: "${userText}"\n\nExtract data from the image and combine with the user's context.`
      : 'Extract all relevant data from this image. The user did not provide additional context.'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Vision API failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]
    
    if (content?.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const extraction = JSON.parse(jsonMatch[0])
        return NextResponse.json(extraction)
      }
    }

    return NextResponse.json(
      { error: 'Failed to extract data from image' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Vision API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image processing failed' },
      { status: 500 }
    )
  }
}
