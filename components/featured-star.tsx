'use client'

import { useState, useCallback } from 'react'

interface FeaturedStarProps {
  entryId: string
  isFeatured: boolean
  size?: number
  onToggle?: (featured: boolean) => void
}

export function FeaturedStar({
  entryId,
  isFeatured,
  size = 22,
  onToggle,
}: FeaturedStarProps) {
  const [featured, setFeatured] = useState(isFeatured)
  const [animating, setAnimating] = useState(false)
  const [pending, setPending] = useState(false)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (pending) return

    setPending(true)
    const newState = !featured

    setFeatured(newState)
    if (newState) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 450)
    }

    try {
      const res = await fetch('/api/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      })

      const result = await res.json()

      if (!res.ok || result.error) {
        setFeatured(!newState)
      } else {
        onToggle?.(result.featured)
        window.location.reload()
      }
    } catch {
      setFeatured(!newState)
    }

    setPending(false)
  }, [entryId, featured, pending, onToggle])

  const tooltip = featured
    ? 'This story is featured on your landing page. Tap to remove.'
    : 'Feature this story on your landing page'

  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltip}
      aria-label={featured ? 'Remove from hero' : 'Feature in hero'}
      aria-pressed={featured}
      style={{
        background: 'none',
        border: 'none',
        cursor: pending ? 'wait' : 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 200ms ease-out',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={featured ? '#DC143C' : 'none'}
        stroke={featured ? '#DC143C' : '#BFBFBF'}
        strokeWidth="1.5"
        style={{
          display: 'block',
          animation: animating ? 'featuredStarSpin 400ms ease-out' : 'none',
          transition: 'fill 200ms ease-out, stroke 200ms ease-out',
        }}
      >
        <path
          d="M12 1 L13.8 9.5 L22 12 L13.8 14.5 L12 23 L10.2 14.5 L2 12 L10.2 9.5 Z"
          strokeLinejoin="round"
        />
      </svg>

      <style jsx>{`
        @keyframes featuredStarSpin {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.25) rotate(72deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        button:active svg {
          transform: scale(0.88);
        }
      `}</style>
    </button>
  )
}
