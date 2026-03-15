export interface NormalizedRecord {
  timestamp: string
  source_domain: string
  content: Record<string, string | number | boolean>
}

export interface TimeWindowBatch {
  window_start: string
  window_end: string
  source_domain: string
  records: NormalizedRecord[]
}

export interface ExtractionFromClaudeExternal {
  category: string
  data: Record<string, string | number | boolean>
  confidence: number
  source_text?: string
}

export type SourceDomain =
  | 'amazon'
  | 'amazon_digital'
  | 'youtube'
  | 'myfitnesspal'
  | 'apple_calendar'
  | 'apple_notes'
  | 'apple_wallet'

export type WindowSize = 'week' | 'month'

export interface DomainConfig {
  source_domain: SourceDomain
  window_size: WindowSize
  data_path: string
  label: string
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  amazon: {
    source_domain: 'amazon',
    window_size: 'month',
    data_path: 'Feb_Metadata/Your Orders-2/Your Amazon Orders',
    label: 'Amazon Orders',
  },
  youtube: {
    source_domain: 'youtube',
    window_size: 'week',
    data_path: 'Feb_Metadata/Takeout-3/YouTube and YouTube Music/history/watch-history.html',
    label: 'YouTube Watch History',
  },
  myfitnesspal: {
    source_domain: 'myfitnesspal',
    window_size: 'week',
    data_path: 'Feb_Metadata/MyFitnessPal_File-Export-2024-06-13-to-2026-03-14',
    label: 'MyFitnessPal',
  },
  apple_calendar: {
    source_domain: 'apple_calendar',
    window_size: 'week',
    data_path: 'Feb_Metadata/iCloud Calendars and Reminders',
    label: 'Apple Calendar',
  },
  apple_notes: {
    source_domain: 'apple_notes',
    window_size: 'month',
    data_path: 'Feb_Metadata/iCloud Notes',
    label: 'Apple Notes',
  },
}

export interface PipelineResult {
  source_domain: string
  batches_processed: number
  batches_skipped: number
  total_extractions: number
  categories_found: string[]
  errors: string[]
}
