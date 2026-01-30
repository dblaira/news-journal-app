'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

// Minimal entry type for the picker (only fields we need)
interface EntryPickerItem {
  id: string
  headline: string
  category: string
  entry_type: string | null
  created_at: string
}

interface EntryPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (entry: { id: string; headline: string; category: string; entry_type?: string | null }) => void
  variant?: 'light' | 'dark'
  excludeEntryId?: string // To exclude current entry from the list
}

export function EntryPickerModal({
  isOpen,
  onClose,
  onSelect,
  variant = 'dark',
  excludeEntryId,
}: EntryPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [entries, setEntries] = useState<EntryPickerItem[]>([])
  const [filteredEntries, setFilteredEntries] = useState<EntryPickerItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const isLight = variant === 'light'
  
  // Fetch entries on mount
  useEffect(() => {
    if (!isOpen) return
    
    const fetchEntries = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setEntries([])
          return
        }
        
        const { data, error } = await supabase
          .from('entries')
          .select('id, headline, category, entry_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)
        
        if (error) {
          console.error('Error fetching entries:', error)
          setEntries([])
          return
        }
        
        // Filter out the excluded entry
        const filtered = excludeEntryId 
          ? (data || []).filter(e => e.id !== excludeEntryId)
          : (data || [])
        
        setEntries(filtered)
        setFilteredEntries(filtered)
      } catch (error) {
        console.error('Error fetching entries:', error)
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEntries()
  }, [isOpen, excludeEntryId])
  
  // Filter entries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredEntries(
        entries.filter(entry =>
          entry.headline.toLowerCase().includes(query) ||
          entry.category.toLowerCase().includes(query) ||
          (entry.entry_type && entry.entry_type.toLowerCase().includes(query))
        )
      )
    }
    setSelectedIndex(0)
  }, [searchQuery, entries])
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredEntries.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredEntries[selectedIndex]) {
        onSelect(filteredEntries[selectedIndex])
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filteredEntries, selectedIndex, onSelect, onClose])
  
  if (!isOpen) return null
  
  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      Business: '💼',
      Finance: '💰',
      Health: '❤️',
      Spiritual: '🙏',
      Fun: '🎉',
      Social: '👥',
      Romance: '💕',
    }
    return emojiMap[category] || '📝'
  }
  
  const getTypeIcon = (type?: string | null) => {
    switch (type) {
      case 'action': return '☑️'
      case 'note': return '📌'
      default: return '📰'
    }
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '70vh',
          background: isLight ? '#FFFFFF' : '#1F2937',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${isLight ? '#E5E7EB' : '#374151'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontWeight: 600, color: isLight ? '#111827' : '#F9FAFB' }}>
              🔗 Link to Entry
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: isLight ? '#6B7280' : '#9CA3AF',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search entries by title, category..."
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${isLight ? '#D1D5DB' : '#4B5563'}`,
              borderRadius: '8px',
              background: isLight ? '#F9FAFB' : '#374151',
              color: isLight ? '#111827' : '#F9FAFB',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        
        {/* Entry List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: isLight ? '#6B7280' : '#9CA3AF' }}>
              Loading entries...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: isLight ? '#6B7280' : '#9CA3AF' }}>
              {searchQuery ? 'No entries match your search' : 'No entries available'}
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => {
                  onSelect(entry)
                  onClose()
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: index === selectedIndex 
                    ? (isLight ? '#EBF5FF' : '#1E3A5F')
                    : 'transparent',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span style={{ fontSize: '20px' }}>
                  {getCategoryEmoji(entry.category)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: isLight ? '#111827' : '#F9FAFB',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.headline}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: isLight ? '#6B7280' : '#9CA3AF',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <span>{getTypeIcon(entry.entry_type)} {entry.entry_type || 'story'}</span>
                    <span>•</span>
                    <span>{entry.category}</span>
                  </div>
                </div>
                <span style={{ color: isLight ? '#9CA3AF' : '#6B7280', fontSize: '12px' }}>
                  ↵
                </span>
              </button>
            ))
          )}
        </div>
        
        {/* Footer hint */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${isLight ? '#E5E7EB' : '#374151'}`,
            fontSize: '12px',
            color: isLight ? '#6B7280' : '#9CA3AF',
            display: 'flex',
            gap: '16px',
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  )
}
