import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entryId } = await request.json()

  if (!entryId) {
    return NextResponse.json({ error: 'Missing entryId' }, { status: 400 })
  }

  // Check current state
  const { data: entry, error: fetchError } = await supabase
    .from('entries')
    .select('id, featured')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  if (entry.featured) {
    // Un-feature this entry
    const { error } = await supabase
      .from('entries')
      .update({ featured: false })
      .eq('id', entryId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ featured: false })
  }

  // Un-feature any currently featured entry
  await supabase
    .from('entries')
    .update({ featured: false })
    .eq('user_id', user.id)
    .eq('featured', true)

  // Feature the selected entry
  const { error: featureError } = await supabase
    .from('entries')
    .update({ featured: true })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (featureError) {
    return NextResponse.json({ error: featureError.message }, { status: 500 })
  }

  return NextResponse.json({ featured: true })
}
