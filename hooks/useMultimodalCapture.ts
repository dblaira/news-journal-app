// hooks/useMultimodalCapture.ts

import { useState } from 'react'
import { ImageAttachment, ImageExtraction } from '@/types/multimodal'

interface ProcessImageResult {
  extractedData: ImageExtraction | null
  imageUrl: string | null
  finalContent: string
}

export function useMultimodalCapture() {
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [processingStep, setProcessingStep] = useState<string>('')

  const processImage = async (
    image: ImageAttachment,
    userText: string,
    userId: string
  ): Promise<ProcessImageResult> => {
    setIsProcessingImage(true)
    let extractedData: ImageExtraction | null = null
    let imageUrl: string | null = null
    let finalContent = userText

    try {
      // Step 1: Extract data from image using Vision API
      setProcessingStep('Analyzing image...')
      const extractionRes = await fetch('/api/process-multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          userText: userText,
        }),
      })

      if (extractionRes.ok) {
        extractedData = await extractionRes.json()
        // Use AI-generated narrative as content if available
        if (extractedData?.combinedNarrative) {
          finalContent = extractedData.combinedNarrative
        }
      } else {
        console.error('Image extraction failed:', await extractionRes.text())
      }

      // Step 2: Upload image to storage
      setProcessingStep('Saving image...')
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: image.base64,
          mimeType: image.mimeType,
          userId: userId,
        }),
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url
      } else {
        console.error('Image upload failed:', await uploadRes.text())
      }

      return { extractedData, imageUrl, finalContent }
    } catch (error) {
      console.error('Multimodal processing error:', error)
      return { extractedData: null, imageUrl: null, finalContent: userText }
    } finally {
      setIsProcessingImage(false)
      setProcessingStep('')
    }
  }

  return {
    processImage,
    isProcessingImage,
    processingStep,
  }
}

