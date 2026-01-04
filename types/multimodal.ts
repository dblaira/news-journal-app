// types/multimodal.ts

export interface ImageAttachment {
  uri: string           // Local URI for display
  base64: string        // Base64 encoded data
  mimeType: string      // image/jpeg, image/png, etc.
}

export interface PurchaseData {
  productName: string
  price: number
  currency: string
  seller: string
  orderDate?: string
  orderId?: string
  category: string
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

export interface ImageExtraction {
  // What type of image is this
  imageType: 'order' | 'receipt' | 'media' | 'travel' | 'screenshot' | 'photo' | 'document' | 'unknown'
  
  // Brief summary combining image + user context
  summary: string
  
  // Structured data (only one will be populated based on imageType)
  purchase?: PurchaseData
  receipt?: ReceiptData
  media?: MediaData
  travel?: TravelData
  
  // Raw text extracted from image
  extractedText?: string
  
  // AI-suggested metadata
  suggestedTags: string[]
  suggestedEntryType: 'story' | 'action' | 'note'
  
  // Combined narrative for the entry content
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

