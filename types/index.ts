// Entry types for the unified entry system
export type EntryType = 'story' | 'action' | 'note' | 'connection'

// Connection subtypes for the belief library
export type ConnectionType = 'identity_anchor' | 'pattern_interrupt' | 'validated_principle' | 'process_anchor'

export interface SurfaceConditions {
  // Legacy field -- algorithm reads time_windows only
  time_of_day?: 'morning' | 'afternoon' | 'evening'
  days_of_week?: number[]
  when_mood?: string[]
  when_energy?: 'low' | 'medium' | 'high'
  when_category_active?: string[]
  when_no_entries_hours?: number
  fixed_schedule?: string
  // Sprint 3 intelligence fields
  time_windows?: ('morning' | 'midday' | 'evening')[]
  min_interval_hours?: number
  priority?: 'high' | 'normal' | 'low'
}

// Re-export multimodal types for convenience
export type { ImageExtraction, ImageAttachment } from './multimodal'

// Re-export metadata types for convenience
export type { EntryMetadata, EntryEnrichment, AutoCapturedMetadata } from './metadata'

// Multi-image support: each entry can have up to 6 images
export interface EntryImage {
  url: string
  extracted_data?: import('./multimodal').ImageExtraction
  is_poster: boolean
  order: number
  // Focal point for image cropping (0-100, where 50,50 is center)
  focal_x?: number
  focal_y?: number
}

// Maximum images allowed per entry
export const MAX_IMAGES_PER_ENTRY = 6

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
  // Unified entry system fields
  // Optional to handle migration period where legacy entries may lack this column
  // Defaults to 'story' in database and should default in code
  entry_type?: EntryType
  due_date?: string | null
  recurrence_rule?: string | null
  completed_at?: string | null
  // Pin feature
  pinned_at?: string | null
  // Entry lineage — links to the parent entry that spawned this one (water cycle)
  source_entry_id?: string | null
  // Connection (belief library) fields
  connection_type?: ConnectionType | null
  surface_conditions?: SurfaceConditions | null
  last_surfaced_at?: string | null
  surface_count?: number
  landed_count?: number
  snooze_count?: number
  snoozed_until?: string | null
  // Multimodal capture fields (legacy single-image support)
  image_url?: string
  image_extracted_data?: import('./multimodal').ImageExtraction
  // Multi-image gallery (new - up to 6 images)
  images?: EntryImage[]
  // Metadata capture fields
  metadata?: import('./metadata').EntryMetadata
}

export interface VersionHighlight {
  start: number
  end: number
}

export interface Version {
  name: string
  title: string
  content: string
  // Structured content for news style
  headline?: string
  body?: string
  // User-highlighted passages (persistent bookmarks)
  highlights?: VersionHighlight[]
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
  // Unified entry system fields
  entry_type?: EntryType
  due_date?: string | null
  recurrence_rule?: string | null
  // Entry lineage
  source_entry_id?: string | null
  // Connection (belief library) fields
  connection_type?: ConnectionType | null
  surface_conditions?: SurfaceConditions | null
  // Multimodal capture fields (legacy single-image support)
  image_url?: string
  image_extracted_data?: import('./multimodal').ImageExtraction
  // Multi-image gallery (new - up to 6 images)
  images?: EntryImage[]
  // Metadata capture fields
  metadata?: import('./metadata').EntryMetadata
}

// Mind Map types
export type MindMapNodeType = 'concept' | 'action' | 'question' | 'theme'
export type MindMapRelationshipType = 'causes' | 'supports' | 'contrasts' | 'contains' | 'related'

export interface MindMapNode {
  id: string
  label: string
  description?: string
  position: { x: number; y: number }
  nodeType: MindMapNodeType
  priority?: string
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
  relationshipType: MindMapRelationshipType
  label?: string
}

export interface MindMap {
  id?: string
  title: string
  sourceText?: string
  sourceEntryId?: string
  nodes: MindMapNode[]
  edges: MindMapEdge[]
}

// React Flow format (what the component expects)
export interface ReactFlowNode {
  id: string
  type?: string
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    nodeType: string
    priority?: string
  }
}

export interface ReactFlowEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: string
  animated?: boolean
  data?: {
    relationshipType?: MindMapRelationshipType
    label?: string
  }
}

