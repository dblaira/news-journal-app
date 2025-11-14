'use client'

import { WeeklyTheme } from '@/types'

interface WeeklyThemeBannerProps {
  theme: WeeklyTheme | null
  onViewTheme?: (theme: WeeklyTheme) => void
}

export function WeeklyThemeBanner({
  theme,
  onViewTheme,
}: WeeklyThemeBannerProps) {
  if (!theme) {
    return null
  }

  return (
    <section className="weekly-theme-banner">
      <div className="weekly-theme-banner__content">
        <span className="weekly-theme-banner__badge">Weekly Theme</span>
        <h2 className="weekly-theme-banner__headline">{theme.headline}</h2>
        <p className="weekly-theme-banner__subtitle">{theme.subtitle}</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {onViewTheme && (
            <button
              type="button"
              className="weekly-theme-banner__button"
              onClick={() => onViewTheme(theme)}
            >
              View Full Analysis
            </button>
          )}
          <button
            type="button"
            className="weekly-theme-banner__button"
            onClick={async () => {
              try {
                const response = await fetch('/api/export-pdf', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'weekly', themeId: theme.id }),
                })
                if (response.ok) {
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `weekly-theme-${theme.id}.pdf`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                } else {
                  alert('Failed to export PDF')
                }
              } catch (error) {
                console.error('Error exporting PDF:', error)
                alert('Failed to export PDF')
              }
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>
    </section>
  )
}

