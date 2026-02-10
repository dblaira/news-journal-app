'use client'

import { EntryType } from '@/types'

interface ContentHeaderProps {
  entryType: EntryType | null
  lifeArea: string
  issueTagline?: string
}

const entryTypeLabels: Record<EntryType, string> = {
  action: 'Actions',
  note: 'Notes',
  story: 'Story',
}

export function ContentHeader({ entryType, lifeArea, issueTagline }: ContentHeaderProps) {
  // Build breadcrumb
  const entryTypeLabel = entryType ? entryTypeLabels[entryType] : 'All Entries'
  const lifeAreaLabel = lifeArea === 'all' ? null : lifeArea

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid #E5E7EB',
        background: '#FFFFFF',
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1F2937',
            fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
          }}
        >
          {entryTypeLabel}
        </h1>
        {lifeAreaLabel && (
          <>
            <span style={{ color: '#9CA3AF', fontSize: '1rem' }}>·</span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: '#6B7280',
              }}
            >
              {lifeAreaLabel}
            </span>
          </>
        )}
      </div>

      {/* Right side - edition tagline */}
      {issueTagline && (
        <span
          style={{
            fontSize: '0.75rem',
            color: '#9CA3AF',
            fontWeight: 500,
            letterSpacing: '0.03rem',
          }}
        >
          {issueTagline}
        </span>
      )}
    </header>
  )
}
