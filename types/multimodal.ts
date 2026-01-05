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
  detected: boolean
  productName: string | null
  price: number | null
  currency: string
  seller: string | null
  orderDate: string | null
  category: string | null
}

export interface UserConnectionAnalysis {
  whatTheyNoticedAbout: string
  whyItMatters: string
  keyElements: string[]
}

export interface ImageExtraction {
  imageType: 'screenshot' | 'photo' | 'receipt' | 'document' | 'message' | 'social' | 'media' | 'playlist' | 'unknown'
  
  primaryContent: PrimaryContent
  extractedText: ExtractedText
  purchase: PurchaseData
  userConnectionAnalysis: UserConnectionAnalysis
  
  suggestedTags: string[]
  suggestedEntryType: 'story' | 'action' | 'note'
  combinedNarrative: string
}

// Legacy types for backwards compatibility with existing entries
export interface LegacyPurchaseData {
  productName: string
  price: number
  currency: string
  seller: string
  orderDate?: string
  orderId?: string
  category: string
}

export interface LegacyReceiptData {
  merchant: string
  total: number
  currency: string
  date: string
  items?: { name: string; price: number }[]
}

export interface LegacyMediaData {
  title: string
  author?: string
  type: 'book' | 'movie' | 'article' | 'podcast' | 'other'
}

export interface LegacyTravelData {
  type: 'flight' | 'hotel' | 'reservation' | 'other'
  confirmationNumber?: string
  date?: string
  destination?: string
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
