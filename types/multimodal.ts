// types/multimodal.ts

export interface ImageAttachment {
  uri: string           // Local URI for display
  base64: string        // Base64 encoded data
  mimeType: string      // image/jpeg, image/png, etc.
}

// Supported file types for attachments
export type FileType = 'image' | 'pdf' | 'csv' | 'xlsx' | 'docx'

export interface FileAttachment {
  uri: string           // Local URI/blob URL for display
  base64: string        // Base64 encoded data
  mimeType: string      // Full MIME type
  fileType: FileType    // Simplified type category
  fileName: string      // Original filename
  fileSize: number      // Size in bytes
}

// File type detection helpers
export const SUPPORTED_MIME_TYPES: Record<FileType, string[]> = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/csv'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
}

export const FILE_EXTENSIONS: Record<FileType, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  pdf: ['.pdf'],
  csv: ['.csv'],
  xlsx: ['.xlsx', '.xls'],
  docx: ['.docx', '.doc'],
}

export function detectFileType(mimeType: string, fileName?: string): FileType | null {
  // Check by MIME type first
  for (const [type, mimes] of Object.entries(SUPPORTED_MIME_TYPES)) {
    if (mimes.includes(mimeType.toLowerCase())) {
      return type as FileType
    }
  }
  
  // Fallback to extension check
  if (fileName) {
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'))
    for (const [type, exts] of Object.entries(FILE_EXTENSIONS)) {
      if (exts.includes(ext)) {
        return type as FileType
      }
    }
  }
  
  return null
}

export function getAcceptString(): string {
  const allMimes = Object.values(SUPPORTED_MIME_TYPES).flat()
  const allExts = Object.values(FILE_EXTENSIONS).flat()
  return [...allMimes, ...allExts].join(',')
}

// New context-aware extraction structure

export interface PrimaryContent {
  type: 'text' | 'list' | 'product' | 'receipt' | 'image' | 'mixed'
  items: string[]
  context: string
}

export interface ExtractedText {
  relevant: string[]    // Text that relates to user's note
  titles: string[]      // Titles, headlines, song names, prominent text
  details: string[]     // Supporting details, metadata, artist names
}

export interface PurchaseData {
  detected?: boolean    // New structure has this flag
  productName: string | null
  price: number | null
  currency: string
  seller: string | null
  orderDate?: string | null
  orderId?: string | null  // Legacy field
  category?: string | null
}

export interface ReceiptData {
  merchant: string
  total: number
  currency: string
  date: string
  items?: { name: string; price: number }[]
}

export interface MediaData {
  title: string
  author?: string
  type: 'book' | 'movie' | 'article' | 'podcast' | 'other'
}

export interface TravelData {
  type: 'flight' | 'hotel' | 'reservation' | 'other'
  confirmationNumber?: string
  date?: string
  destination?: string
}

export interface UserConnectionAnalysis {
  whatTheyNoticedAbout: string
  whyItMatters: string
  keyElements: string[]
}

export interface ImageExtraction {
  imageType: 'screenshot' | 'photo' | 'receipt' | 'document' | 'message' | 'social' | 'media' | 'playlist' | 'order' | 'unknown'
  
  // New context-aware fields
  primaryContent?: PrimaryContent
  extractedText?: ExtractedText
  userConnectionAnalysis?: UserConnectionAnalysis
  
  // Purchase with detected flag (new structure)
  purchase?: PurchaseData
  
  // Legacy fields for backwards compatibility with existing entries
  receipt?: ReceiptData
  media?: MediaData
  travel?: TravelData
  
  // Legacy summary field
  summary?: string
  extractedTextLegacy?: string  // Old extractedText was a string
  
  suggestedTags: string[]
  suggestedEntryType: 'story' | 'action' | 'note'
  combinedNarrative: string
}

export interface MultimodalCaptureInput {
  text: string
  image?: ImageAttachment
  entryType?: 'story' | 'action' | 'note'
}

export interface MultimodalCaptureResult {
  entryId: string
  content: string
  entryType: string
  imageUrl?: string
  extractedData?: ImageExtraction
}
