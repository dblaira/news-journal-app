// app/api/user-preferences/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Get user's preferences
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const type = searchParams.get('type') // Optional: filter by type
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  let query = supabase
    .from('user_metadata_preferences')
    .select('*')
    .eq('user_id', userId)
    .order('usage_count', { ascending: false })
  
  if (type) {
    query = query.eq('preference_type', type)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 })
  }
  
  return NextResponse.json({ preferences: data || [] })
}

// Create a new preference
export async function POST(request: Request) {
  try {
    const { userId, type, value, metadata } = await request.json()
    
    if (!userId || !type || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, value' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Check if preference already exists
    const { data: existing } = await supabase
      .from('user_metadata_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('preference_type', type)
      .eq('value', value)
      .single()
    
    if (existing) {
      // Already exists, just return it
      return NextResponse.json(existing)
    }
    
    // Create new preference
    const { data, error } = await supabase
      .from('user_metadata_preferences')
      .insert({
        user_id: userId,
        preference_type: type,
        value,
        metadata: metadata || {},
        usage_count: 1,
      })
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create preference error:', error)
    return NextResponse.json({ error: 'Failed to create preference' }, { status: 500 })
  }
}

// Delete a preference
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const id = searchParams.get('id')
  
  if (!userId || !id) {
    return NextResponse.json({ error: 'Missing userId or id' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('user_metadata_preferences')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  
  if (error) {
    console.error('Delete preference error:', error)
    return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

