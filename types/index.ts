export interface Entry {
  id: string
  headline: string
  category: 'Business' | 'Finance' | 'Health' | 'Spiritual' | 'Fun' | 'Social' | 'Romance'
  subheading?: string
  content: string
  mood?: string
  versions?: Version[]
  generating_versions?: boolean
  user_id: string
  created_at: string
  updated_at?: string
  isSample?: boolean
  photo_url?: string
  photo_processed?: boolean
  week_theme_id?: string
  view_count?: number
}

export interface Version {
  name: string
  title: string
  content: string
}

export interface WeeklyTheme {
  id: string
  user_id: string
  headline: string
  subtitle: string
  theme_content: string
  entry_ids: string[]
  week_start_date: string
  created_at: string
  updated_at?: string
}

export interface CreateEntryInput {
  headline: string
  category: Entry['category']
  subheading?: string
  content: string
  mood?: string
  photo_url?: string
}

