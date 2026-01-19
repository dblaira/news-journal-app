import { NextRequest } from 'next/server'
import { ImageResponse } from '@vercel/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// Category colors for visual styling
const CATEGORY_COLORS: Record<string, string> = {
  Business: '#3B82F6',
  Finance: '#10B981',
  Health: '#EF4444',
  Spiritual: '#8B5CF6',
  Fun: '#F59E0B',
  Social: '#EC4899',
  Romance: '#DC143C',
}

// Strip HTML tags for plain text display
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

// Truncate text to a maximum length with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')
    const mode = searchParams.get('mode') || 'card'

    if (!entryId) {
      return new Response('Missing entryId parameter', { status: 400 })
    }

    // Fetch entry from database
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: entry, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single()

    if (error || !entry) {
      return new Response('Entry not found', { status: 404 })
    }

    const categoryColor = CATEGORY_COLORS[entry.category] || '#6B7280'
    const contentText = stripHtml(entry.content || '')
    const headline = entry.headline || 'Untitled'
    const dateStr = formatDate(entry.created_at)

    if (mode === 'card') {
      // Social Card: 1200x630px
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#111827',
              padding: 48,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  backgroundColor: categoryColor,
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {entry.category.toUpperCase()}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 48,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              {truncateText(headline, 80)}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#9CA3AF',
                lineHeight: 1.5,
                flex: 1,
              }}
            >
              {truncateText(contentText, 300)}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24,
                paddingTop: 24,
                borderTop: '1px solid #374151',
              }}
            >
              <div style={{ display: 'flex', color: '#6B7280', fontSize: 16 }}>
                {dateStr}
              </div>
              <div style={{ display: 'flex', color: '#DC143C', fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                Understood.
              </div>
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      )
    } else {
      // Full Entry: 800px wide, variable height
      const height = Math.min(1200, Math.max(600, 300 + contentText.length * 0.4))

      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              padding: 48,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  backgroundColor: categoryColor,
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {entry.category.toUpperCase()}
              </div>
              <div style={{ display: 'flex', color: '#6B7280', fontSize: 14 }}>
                {dateStr}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: 2,
                backgroundColor: '#E5E7EB',
                marginBottom: 16,
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: 16,
                color: '#374151',
                lineHeight: 1.7,
                flex: 1,
              }}
            >
              {truncateText(contentText, 1500)}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid #E5E7EB',
              }}
            >
              <div style={{ display: 'flex', color: '#DC143C', fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                Understood.
              </div>
            </div>
          </div>
        ),
        { width: 800, height }
      )
    }
  } catch (error) {
    console.error('Export image error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Failed to generate image',
      { status: 500 }
    )
  }
}
