export interface Extraction {
  id: string
  user_id: string
  entry_id: string
  category: string
  data: Record<string, string | number | boolean>
  confidence: number
  source_text?: string
  batch_id: string
  created_at: string
}

export interface ExtractionFromClaude {
  entry_id: string
  category: string
  data: Record<string, string | number | boolean>
  confidence: number
  source_text?: string
}

export interface ExtractionBatchResult {
  batch_id: string | null
  total_entries_processed: number
  total_extractions_found: number
  categories_found: string[]
  extraction_ids: string[]
  message?: string
}

export interface ExtractionWithEntryDate extends Extraction {
  entries: { created_at: string }
}

export interface MapNode {
  id: string
  label: string
  category: string
  type: 'category' | 'concept'
  parentId?: string
  importance: number
  confidence: number
  occurrences: number
  color: string
}
