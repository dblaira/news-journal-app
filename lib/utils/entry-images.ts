/**
 * Utility functions for working with entry images
 * These are NOT server actions, just regular helper functions
 */

import { Entry, EntryImage } from '@/types'

/**
 * Get poster image URL for an entry (for card display)
 * Falls back to legacy image_url/photo_url if no images array
 */
export function getEntryPosterUrl(entry: Entry): string | undefined {
  // Check new images array first
  if (entry.images && entry.images.length > 0) {
    const poster = entry.images.find(img => img.is_poster)
    return poster?.url || entry.images[0]?.url
  }
  
  // Fallback to legacy single image fields
  return entry.image_url || entry.photo_url
}

/**
 * Get poster image with focal point for an entry
 * Returns both URL and object-position style value
 */
export function getEntryPosterWithFocalPoint(entry: Entry): { url: string | undefined; objectPosition: string } {
  // Check new images array first
  if (entry.images && entry.images.length > 0) {
    const poster = entry.images.find(img => img.is_poster) || entry.images[0]
    if (poster) {
      const x = poster.focal_x ?? 50
      const y = poster.focal_y ?? 50
      return {
        url: poster.url,
        objectPosition: `${x}% ${y}%`,
      }
    }
  }
  
  // Fallback to legacy single image fields (no focal point)
  return {
    url: entry.image_url || entry.photo_url,
    objectPosition: '50% 50%',
  }
}

/**
 * Get all images for an entry (combining legacy and new format)
 */
export function getEntryImages(entry: Entry): EntryImage[] {
  // If entry has new images array, use it
  if (entry.images && entry.images.length > 0) {
    return entry.images
  }
  
  // Convert legacy single image to array format
  const legacyUrl = entry.image_url || entry.photo_url
  if (legacyUrl) {
    return [{
      url: legacyUrl,
      extracted_data: entry.image_extracted_data,
      is_poster: true,
      order: 0,
    }]
  }
  
  return []
}
