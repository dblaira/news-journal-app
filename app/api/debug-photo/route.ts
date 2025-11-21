import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
    }

    // Get entry with photo_url
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('id, headline, photo_url, user_id')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    // Test if photo URL is accessible
    let photoAccessible = false
    let photoError = null
    if (entry.photo_url) {
      try {
        const response = await fetch(entry.photo_url, { method: 'HEAD' })
        photoAccessible = response.ok
        if (!response.ok) {
          photoError = `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (error: any) {
        photoError = error.message
      }
    }

    // Generate expected URL format
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const expectedPath = `${user.id}/${entryId}.webp`
    const expectedUrl = supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/entry-photos/${expectedPath}`
      : null

    // Test expected URL
    let expectedUrlAccessible = false
    if (expectedUrl) {
      try {
        const response = await fetch(expectedUrl, { method: 'HEAD' })
        expectedUrlAccessible = response.ok
      } catch (error) {
        // Ignore
      }
    }

    return NextResponse.json({
      entry: {
        id: entry.id,
        headline: entry.headline,
        photo_url: entry.photo_url,
      },
      photoUrl: {
        stored: entry.photo_url,
        accessible: photoAccessible,
        error: photoError,
      },
      expectedUrl: {
        path: expectedPath,
        url: expectedUrl,
        accessible: expectedUrlAccessible,
      },
      supabaseUrl,
    })
  } catch (error) {
    console.error('Error debugging photo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

