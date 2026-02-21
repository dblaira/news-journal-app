import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — fetch error logs or feedback items
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table') ?? 'debug_logs'

  if (table === 'debug_feedback') {
    const { data, error } = await supabase
      .from('debug_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ feedback: data })
  }

  const level = searchParams.get('level')
  const page = searchParams.get('page')
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)

  let query = supabase
    .from('debug_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (level) query = query.eq('level', level)
  if (page) query = query.eq('page', page)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs: data })
}

// POST — submit feedback
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { category, message, page, metadata } = body

  if (!category || !message || !page) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('debug_feedback')
    .insert({
      user_id: user.id,
      category,
      message,
      page,
      metadata: metadata ?? {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ feedback: data })
}

// PATCH — resolve or unresolve a feedback item
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, resolved } = body

  if (!id || typeof resolved !== 'boolean') {
    return NextResponse.json({ error: 'Missing id or resolved' }, { status: 400 })
  }

  const { error } = await supabase
    .from('debug_feedback')
    .update({ resolved })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ updated: true })
}

// DELETE — clear all error logs or delete a specific feedback item
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table') ?? 'debug_logs'
  const id = searchParams.get('id')

  if (table === 'debug_feedback' && id) {
    const { error } = await supabase
      .from('debug_feedback')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ deleted: true })
  }

  const { error } = await supabase
    .from('debug_logs')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cleared: true })
}
