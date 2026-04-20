import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyThemeLogic } from '@/lib/ai/generate-weekly-theme.server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryIds }: { entryIds: string[] } = await request.json()

    if (!entryIds || entryIds.length !== 7) {
      return NextResponse.json(
        { error: 'Exactly 7 entry IDs are required' },
        { status: 400 }
      )
    }

    const theme = await generateWeeklyThemeLogic(entryIds, user.id)
    return NextResponse.json({ theme })
  } catch (error) {
    console.error('Error generating weekly theme:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

