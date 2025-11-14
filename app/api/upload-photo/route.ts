import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processEntryPhoto } from '@/lib/image/process-photo.server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entryId = formData.get('entryId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    // Verify entry belongs to user
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('id')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    // Process and upload photo
    const photoUrl = await processEntryPhoto(file, user.id, entryId)

    // Update entry with photo URL
    const { error: updateError } = await supabase
      .from('entries')
      .update({
        photo_url: photoUrl,
        photo_processed: true,
      })
      .eq('id', entryId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update entry: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

