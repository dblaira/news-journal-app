// types/metadata.ts

// Auto-captured (happens silently at entry creation)
export interface AutoCapturedMetadata {
  captured_at: string           // ISO timestamp
  day_of_week: string          // "Sunday", "Monday", etc.
  time_of_day: string          // "morning", "afternoon", "evening", "night" (customizable)
  device: 'mobile' | 'tablet' | 'desktop'
  location?: {
    lat: number
    lng: number
    raw_name: string           // What geocoding returned ("Tustin, CA")
    display_name: string       // What user sees (might be "Newport Beach" if corrected)
    label?: string             // "home", "work", "gym", etc. (learned)
  }
}

// User-added enrichment (optional, add anytime)
export interface EntryEnrichment {
  activity?: string            // "after workout", "during commute", custom
  energy?: 'low' | 'medium' | 'high' | string  // Allow custom labels
  mood?: string[]              // ["focused", "anxious", "playful"]
  environment?: string         // Free text: "standing desk in living room"
  trigger?: string             // Free text: "saw a tweet about..."
  context_order?: string[]     // Order of context categories for display ["environment", "activity", "mood"]
}

// Combined metadata stored on entry
export interface EntryMetadata extends AutoCapturedMetadata {
  enrichment?: EntryEnrichment
  user_overrides?: {
    [key: string]: {
      original: string
      corrected: string
      corrected_at: string
    }
  }
}

// User's learned preferences
export interface UserPreference {
  id: string
  user_id: string
  preference_type: 'location_label' | 'activity' | 'mood' | 'time_label' | 'energy_label'
  value: string
  usage_count: number
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Learned location
export interface UserLocation {
  id: string
  user_id: string
  label: string
  latitude: number
  longitude: number
  radius_meters: number
  is_area: boolean
  entry_count: number
  created_at: string
  updated_at: string
}

// Input for learning a location
export interface LearnLocationInput {
  userId: string
  lat: number
  lng: number
  label: string
  isArea?: boolean
  radiusMeters?: number
}

// Input for tracking preference usage
export interface TrackPreferenceInput {
  userId: string
  type: string
  value: string
}

