// types/multimodal.ts

export interface ImageAttachment {
  uri: string           // Local URI for display
  base64: string        // Base64 encoded data
  mimeType: string      // image/jpeg, image/png, etc.
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
