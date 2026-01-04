// Entry types for the unified entry system
export type EntryType = 'story' | 'action' | 'note'

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
}

export interface Version {
  name: string
  title: string
  content: string
  // Structured content for news style
  headline?: string
  body?: string
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

