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
}

export interface Version {
  name: string
  title: string
  content: string
}

export interface CreateEntryInput {
  headline: string
  category: Entry['category']
  subheading?: string
  content: string
  mood?: string
}

