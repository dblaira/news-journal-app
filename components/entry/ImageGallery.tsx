'use client'

import { useState } from 'react'
import { EntryImage } from '@/types'
import { setEntryPoster, removeEntryImage } from '@/app/actions/entries'

interface ImageGalleryProps {
  images: EntryImage[]
  entryId: string
  onImagesUpdated?: (images: EntryImage[]) => void
  editable?: boolean
}

type ViewMode = 'carousel' | 'grid'

export function ImageGallery({ 
  images, 
  entryId, 
  onImagesUpdated,
  editable = true 
}: ImageGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('carousel')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)

  if (images.length === 0) return null

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleSetPoster = async (index: number) => {
    if (!editable) return
    setIsUpdating(true)
    try {
      const result = await setEntryPoster(entryId, index)
      if (result.success && result.images) {
        onImagesUpdated?.(result.images)
      } else if (result.error) {
        alert(result.error)
      }
    } catch (err) {
      console.error('Error setting poster:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveImage = async (index: number) => {
    if (!editable) return
    if (!confirm('Remove this image?')) return
    
    setIsUpdating(true)
    try {
      const result = await removeEntryImage(entryId, index)
      if (result.success && result.images) {
        onImagesUpdated?.(result.images)
        // Adjust current index if needed
        if (currentIndex >= result.images.length) {
          setCurrentIndex(Math.max(0, result.images.length - 1))
        }
      } else if (result.error) {
        alert(result.error)
      }
    } catch (err) {
      console.error('Error removing image:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* View mode toggle */}
      {images.length > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem' 
        }}>
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#6B7280',
            fontWeight: 500,
          }}>
            {images.length} images
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('carousel')}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                background: viewMode === 'carousel' ? '#DC143C' : 'transparent',
                color: viewMode === 'carousel' ? '#fff' : '#6B7280',
                border: viewMode === 'carousel' ? 'none' : '1px solid #D1D5DB',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Carousel
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                background: viewMode === 'grid' ? '#DC143C' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : '#6B7280',
                border: viewMode === 'grid' ? 'none' : '1px solid #D1D5DB',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Grid
            </button>
          </div>
        </div>
      )}

      {/* Carousel View */}
      {viewMode === 'carousel' && (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%', // 16:9 aspect ratio
              background: '#f3f4f6',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <img
              src={images[currentIndex].url}
              alt={`Image ${currentIndex + 1}`}
              onClick={() => openLightbox(currentIndex)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
            />
            
            {/* Poster badge */}
            {images[currentIndex].is_poster && (
              <div
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '0.5rem',
                  background: '#DC143C',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Poster
              </div>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                style={{
                  position: 'absolute',
                  left: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ‹
              </button>
              <button
                onClick={handleNext}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.25rem',
              }}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    flexShrink: 0,
                    width: '60px',
                    height: '60px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: idx === currentIndex ? '2px solid #DC143C' : '2px solid transparent',
                    padding: 0,
                    cursor: 'pointer',
                    background: 'none',
                    opacity: idx === currentIndex ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Action buttons for current image */}
          {editable && (
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '0.75rem',
              flexWrap: 'wrap',
            }}>
              {!images[currentIndex].is_poster && (
                <button
                  onClick={() => handleSetPoster(currentIndex)}
                  disabled={isUpdating}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    background: 'transparent',
                    color: '#2563EB',
                    border: '1px solid #2563EB',
                    borderRadius: '4px',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    opacity: isUpdating ? 0.6 : 1,
                  }}
                >
                  Set as Poster
                </button>
              )}
              <button
                onClick={() => handleRemoveImage(currentIndex)}
                disabled={isUpdating}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.75rem',
                  background: 'transparent',
                  color: '#DC143C',
                  border: '1px solid #DC143C',
                  borderRadius: '4px',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  opacity: isUpdating ? 0.6 : 1,
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                paddingTop: '100%', // Square aspect ratio
                background: '#f3f4f6',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => openLightbox(idx)}
            >
              <img
                src={img.url}
                alt={`Image ${idx + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {/* Poster badge */}
              {img.is_poster && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0.35rem',
                    left: '0.35rem',
                    background: '#DC143C',
                    color: '#fff',
                    padding: '0.15rem 0.35rem',
                    borderRadius: '3px',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Poster
                </div>
              )}

              {/* Hover overlay with actions */}
              {editable && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '1.5rem 0.5rem 0.5rem',
                    display: 'flex',
                    gap: '0.25rem',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!img.is_poster && (
                    <button
                      onClick={() => handleSetPoster(idx)}
                      disabled={isUpdating}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.65rem',
                        background: 'rgba(255,255,255,0.9)',
                        color: '#2563EB',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      ★ Poster
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    disabled={isUpdating}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.65rem',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#DC143C',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              fontSize: '2rem',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ×
          </button>

          <img
            src={images[lightboxIndex].url}
            alt={`Full size ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
            }}
          />

          {/* Lightbox navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                }}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                }}
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                }}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                }}
              >
                ›
              </button>
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              >
                {lightboxIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
