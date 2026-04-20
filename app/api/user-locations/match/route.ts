// app/api/user-locations/match/route.ts

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

// Find matching learned location for coordinates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Find locations within reasonable range
  const { data: locations } = await supabase
    .from('user_locations')
    .select('*')
    .eq('user_id', userId)
    .gte('latitude', lat - 0.01)   // ~1km range for initial filter
    .lte('latitude', lat + 0.01)
    .gte('longitude', lng - 0.01)
    .lte('longitude', lng + 0.01)
  
  if (!locations || locations.length === 0) {
    return NextResponse.json({ label: null })
  }
  
  // Find closest match within radius
  for (const loc of locations) {
    const distance = getDistanceMeters(lat, lng, loc.latitude, loc.longitude)
    if (distance <= loc.radius_meters) {
      return NextResponse.json({ label: loc.label, location: loc })
    }
  }
  
  return NextResponse.json({ label: null })
}

