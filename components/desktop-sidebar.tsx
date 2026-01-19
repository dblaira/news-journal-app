'use client'

import { useState, useEffect } from 'react'
import { EntryType } from '@/types'

interface DesktopSidebarProps {
  currentLifeArea: string
  onLifeAreaChange: (area: string) => void
  currentEntryType: EntryType | null
  onEntryTypeChange: (type: EntryType | null) => void
  onCompose: () => void
  onLogout: () => void
  actionCount?: number
}

const lifeAreas = [
  { value: 'all', label: 'All' },
  { value: 'Business', label: 'Business' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Health', label: 'Health' },
  { value: 'Spiritual', label: 'Spiritual' },
  { value: 'Fun', label: 'Fun' },
  { value: 'Social', label: 'Social' },
  { value: 'Romance', label: 'Romance' },
]

const entryTypes: { value: EntryType; label: string; icon: string }[] = [
  { value: 'action', label: 'Actions', icon: '☑' },
  { value: 'note', label: 'Notes', icon: '📝' },
  { value: 'story', label: 'Story', icon: '📰' },
]

export function DesktopSidebar({
  currentLifeArea,
  onLifeAreaChange,
  currentEntryType,
  onEntryTypeChange,
  onCompose,
  onLogout,
  actionCount = 0,
}: DesktopSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleEntryTypeClick = (type: EntryType) => {
    // If clicking the same type, don't deselect - keep the selection
    onEntryTypeChange(type)
  }

  const collapsedWidth = '64px'
  const expandedWidth = '260px'

  return (
    <aside
      className="hidden lg:flex"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: isExpanded ? expandedWidth : collapsedWidth,
        background: '#0A0A0A',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Header with logo and toggle */}
      <div
        style={{
          padding: isExpanded ? '1.25rem 1.5rem' : '1.25rem 0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          minHeight: '72px',
        }}
      >
        {isExpanded ? (
          <>
            <span
              style={{
                color: '#FFFFFF',
                fontSize: '1.15rem',
                fontWeight: 400,
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                letterSpacing: '0.02rem',
                whiteSpace: 'nowrap',
              }}
            >
              Understood.
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse sidebar"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '0.5rem',
                fontSize: '1rem',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ‹
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            aria-label="Expand sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '0.5rem',
              position: 'relative',
            }}
          >
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                fontFamily: 'var(--font-playfair)',
              }}
            >
              P
            </span>
            {/* Badge for action count */}
            {actionCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '-2px',
                  background: '#DC143C',
                  color: '#FFFFFF',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.3rem',
                  borderRadius: '8px',
                  minWidth: '16px',
                  textAlign: 'center',
                }}
              >
                {actionCount > 99 ? '99+' : actionCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isExpanded ? '1rem 0' : '1rem 0.5rem',
        }}
      >
        {isExpanded ? (
          <>
            {/* Entries Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  padding: '0 1.5rem',
                  marginBottom: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.1rem',
                  textTransform: 'uppercase',
                }}
              >
                Entries
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {entryTypes.map((type) => (
                  <li key={type.value}>
                    <button
                      onClick={() => handleEntryTypeClick(type.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.65rem 1.5rem',
                        background: currentEntryType === type.value ? 'rgba(220, 20, 60, 0.15)' : 'transparent',
                        border: 'none',
                        borderLeft: currentEntryType === type.value ? '3px solid #DC143C' : '3px solid transparent',
                        color: currentEntryType === type.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{type.icon}</span>
                      <span>{type.label}</span>
                      {type.value === 'action' && actionCount > 0 && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            background: 'rgba(220, 20, 60, 0.9)',
                            color: '#FFFFFF',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '10px',
                          }}
                        >
                          {actionCount}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Life Areas Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  padding: '0 1.5rem',
                  marginBottom: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.1rem',
                  textTransform: 'uppercase',
                }}
              >
                Life Areas
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {lifeAreas.map((area) => (
                  <li key={area.value}>
                    <button
                      onClick={() => onLifeAreaChange(area.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '0.5rem 1.5rem 0.5rem 2rem',
                        background: currentLifeArea === area.value ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        border: 'none',
                        color: currentLifeArea === area.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.85rem',
                        fontWeight: currentLifeArea === area.value ? 600 : 400,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {area.label}
                      {currentLifeArea === area.value && (
                        <span style={{ marginLeft: 'auto', color: '#DC143C', fontSize: '0.6rem' }}>●</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compose Button */}
            <div style={{ padding: '0 1rem', marginTop: 'auto' }}>
              <button
                onClick={onCompose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.85rem 1rem',
                  background: '#DC143C',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.05rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>+</span>
                Compose
              </button>
            </div>
          </>
        ) : (
          /* Collapsed state - icon buttons only */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {entryTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleEntryTypeClick(type.value)}
                title={type.label}
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentEntryType === type.value ? 'rgba(220, 20, 60, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: currentEntryType === type.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {type.icon}
                {type.value === 'action' && actionCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: '#DC143C',
                      color: '#FFFFFF',
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.25rem',
                      borderRadius: '6px',
                      minWidth: '14px',
                      textAlign: 'center',
                    }}
                  >
                    {actionCount > 9 ? '9+' : actionCount}
                  </span>
                )}
              </button>
            ))}

            {/* Collapsed compose button */}
            <button
              onClick={onCompose}
              title="Compose"
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#DC143C',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '1.5rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Footer with logout */}
      <div
        style={{
          padding: isExpanded ? '1rem 1.5rem' : '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={onLogout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            gap: '0.75rem',
            width: '100%',
            padding: isExpanded ? '0.65rem 0' : '0.5rem',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.85rem',
            fontWeight: 500,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>⎋</span>
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
