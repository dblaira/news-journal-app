// app/api/user-locations/display-name/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Haversine formula for distance in meters
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get display name override for coordinates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Find area-type locations (is_area = true) that might override display name
  const { data: locations } = await supabase
    .from('user_locations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_area', true)
    .gte('latitude', lat - 0.05)   // ~5km range for areas
    .lte('latitude', lat + 0.05)
    .gte('longitude', lng - 0.05)
    .lte('longitude', lng + 0.05)
  
  if (!locations || locations.length === 0) {
    return NextResponse.json({ override: null })
  }
  
  // Find matching area
  for (const loc of locations) {
    const distance = getDistanceMeters(lat, lng, loc.latitude, loc.longitude)
    if (distance <= loc.radius_meters) {
      return NextResponse.json({ override: loc.label })
    }
  }
  
  return NextResponse.json({ override: null })
}

