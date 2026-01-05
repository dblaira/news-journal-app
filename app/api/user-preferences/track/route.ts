// app/api/user-preferences/track/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Track usage of a preference (increments usage_count for sorting)
export async function POST(request: Request) {
  try {
    const { userId, type, value } = await request.json()
    
    if (!userId || !type || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, value' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Check if preference exists
    const { data: existing } = await supabase
      .from('user_metadata_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('preference_type', type)
      .eq('value', value)
      .single()
    
    if (existing) {
      // Increment usage count
      const { data, error } = await supabase
        .from('user_metadata_preferences')
        .update({
          usage_count: existing.usage_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    }
    
    // Create new preference with count of 1
    const { data, error } = await supabase
      .from('user_metadata_preferences')
      .insert({
        user_id: userId,
        preference_type: type,
        value,
        usage_count: 1,
      })
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Track preference error:', error)
    return NextResponse.json({ error: 'Failed to track preference' }, { status: 500 })
  }
}

