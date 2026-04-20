// lib/captureMetadata.ts

import { AutoCapturedMetadata } from '@/types/metadata'

// Detect device type from user agent
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const ua = navigator.userAgent.toLowerCase()
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return 'mobile'
  return 'desktop'
}

// Get time of day label (user can customize these)
function getTimeOfDay(hour: number, customLabels?: Record<string, [number, number]>): string {
  // Default labels (can be overridden per user)
  const defaults: Record<string, [number, number]> = {
    'morning': [5, 12],
    'afternoon': [12, 17],
    'evening': [17, 21],
    'night': [21, 5],
  }
  
  const labels = customLabels || defaults
  
  for (const [label, [start, end]] of Object.entries(labels)) {
    if (start < end) {
      if (hour >= start && hour < end) return label
    } else {
      // Handles overnight ranges like night: 21-5
      if (hour >= start || hour < end) return label
    }
  }
  
  return 'afternoon' // fallback
}

// Reverse geocode coordinates to place name
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Using free Nominatim API (consider caching or paid service for production)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'PersonalPressJournal/1.0',
        },
      }
    )
    const data = await response.json()
    
    // Return city, state format
    const city = data.address?.city || data.address?.town || data.address?.village || ''
    const state = data.address?.state || ''
    
    if (city && state) {
      return `${city}, ${state}`
    }
    return city || data.display_name?.split(',')[0] || 'Unknown'
  } catch {
    return 'Unknown'
  }
}

// Check if user has a learned label for this location
async function getLearnedLocationLabel(
  userId: string,
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(`/api/user-locations/match?userId=${userId}&lat=${lat}&lng=${lng}`)
    if (response.ok) {
      const data = await response.json()
      return data.label || null
    }
  } catch {
    // Silently fail - not critical
  }
  return null
}

// Get display name (checks for user overrides)
async function getLocationDisplayName(
  userId: string,
  lat: number,
  lng: number,
  rawName: string
): Promise<string> {
  try {
    const response = await fetch(
      `/api/user-locations/display-name?userId=${userId}&lat=${lat}&lng=${lng}`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.override) {
        return data.override
      }
    }
  } catch {
    // Silently fail - use raw name
  }
  return rawName
}

// Main auto-capture function
export async function captureMetadata(
  userId: string,
  requestLocation: boolean = true
): Promise<AutoCapturedMetadata> {
  const now = new Date()
  
  const metadata: AutoCapturedMetadata = {
    captured_at: now.toISOString(),
    day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
    time_of_day: getTimeOfDay(now.getHours()),
    device: getDeviceType(),
  }
  
  // Request location if enabled
  if (requestLocation && typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,  // Faster, less battery
          timeout: 5000,
          maximumAge: 300000,         // Cache for 5 minutes
        })
      })
      
      const { latitude, longitude } = position.coords
      
      // Reverse geocode to get place name
      const placeName = await reverseGeocode(latitude, longitude)
      
      // Check for learned location label
      const learnedLabel = await getLearnedLocationLabel(userId, latitude, longitude)
      
      // Check for user override on this area
      const displayName = await getLocationDisplayName(userId, latitude, longitude, placeName)
      
      metadata.location = {
        lat: latitude,
        lng: longitude,
        raw_name: placeName,
        display_name: displayName,
        label: learnedLabel || undefined,
      }
    } catch (error) {
      console.log('Location not available:', error)
      // Continue without location - not a failure
    }
  }
  
  return metadata
}

// Lightweight capture without location (for quick captures)
export function captureMetadataSync(): Omit<AutoCapturedMetadata, 'location'> {
  const now = new Date()
  
  return {
    captured_at: now.toISOString(),
    day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
    time_of_day: getTimeOfDay(now.getHours()),
    device: getDeviceType(),
  }
}

