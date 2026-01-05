// app/api/entries/[id]/metadata/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Update entry metadata
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { metadata } = await request.json()
    
    if (!metadata) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('entries')
      .update({ metadata })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update metadata error:', error)
    return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 })
  }
}

// Get entry metadata
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('entries')
      .select('metadata')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return NextResponse.json(data?.metadata || {})
  } catch (error) {
    console.error('Get metadata error:', error)
    return NextResponse.json({ error: 'Failed to get metadata' }, { status: 500 })
  }
}

