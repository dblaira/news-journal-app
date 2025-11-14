import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'

export async function processEntryPhoto(
  file: File,
  userId: string,
  entryId: string
): Promise<string> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.')
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Process image with Sharp
  const processedBuffer = await sharp(buffer)
    .resize(1200, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: 85 })
    .toBuffer()

  // Upload to Supabase Storage
  const supabase = createClient()
  const fileName = `${entryId}.webp`
  const filePath = `${userId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('entry-photos')
    .upload(filePath, processedBuffer, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('entry-photos').getPublicUrl(filePath)

  return publicUrl
}

