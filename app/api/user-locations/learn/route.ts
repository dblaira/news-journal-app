// app/api/user-locations/learn/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Learn a new location label or update existing
export async function POST(request: Request) {
  try {
    const { userId, lat, lng, label, isArea, radiusMeters } = await request.json()
    
    if (!userId || !lat || !lng || !label) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, lat, lng, label' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Check if location already exists nearby
    const { data: existing } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .gte('latitude', lat - 0.005)  // ~500m range
      .lte('latitude', lat + 0.005)
      .gte('longitude', lng - 0.005)
      .lte('longitude', lng + 0.005)
      .single()
    
    if (existing) {
      // Update existing location
      const { data, error } = await supabase
        .from('user_locations')
        .update({
          label,
          entry_count: existing.entry_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    }
    
    // Create new learned location
    const { data, error } = await supabase
      .from('user_locations')
      .insert({
        user_id: userId,
        label,
        latitude: lat,
        longitude: lng,
        radius_meters: radiusMeters || 200,
        is_area: isArea || false,
        entry_count: 1,
      })
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Learn location error:', error)
    return NextResponse.json({ error: 'Failed to learn location' }, { status: 500 })
  }
}

