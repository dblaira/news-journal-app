'use client'

import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { CALLOUT_TYPES, CalloutType } from './extensions/Callout'

interface ToolbarProps {
  editor: Editor | null
  variant?: 'light' | 'dark'
  entryType?: 'story' | 'action' | 'note'
  onOpenEntryPicker?: () => void
}

// Apple Notes-style color palette
const TEXT_COLORS = [
  { name: 'Default', color: null },
  { name: 'Yellow', color: '#EAB308' },
  { name: 'Orange', color: '#F97316' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Mint', color: '#10B981' },
]

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#FEF08A' },
  { name: 'Green', color: '#BBF7D0' },
  { name: 'Blue', color: '#BFDBFE' },
  { name: 'Pink', color: '#FBCFE8' },
  { name: 'Orange', color: '#FED7AA' },
]

export function Toolbar({ editor, variant = 'dark', entryType, onOpenEntryPicker }: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showCalloutPicker, setShowCalloutPicker] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const highlightPickerRef = useRef<HTMLDivElement>(null)
  const calloutPickerRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(event.target as Node)) {
        setShowHighlightPicker(false)
      }
      if (calloutPickerRef.current && !calloutPickerRef.current.contains(event.target as Node)) {
        setShowCalloutPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!editor) return null

  const isLight = variant === 'light'
  const isAction = entryType === 'action'

  const buttonClass = (isActive: boolean) =>
    `px-2 py-1 text-sm rounded transition-colors ${
      isActive
        ? isLight 
          ? 'bg-neutral-200 text-neutral-900'
          : 'bg-neutral-700 text-white'
        : isLight
          ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
    }`

  const dividerClass = isLight ? 'w-px bg-neutral-300 mx-1' : 'w-px bg-neutral-700 mx-1'

  // Get current text color for the button indicator
  const currentColor = editor.getAttributes('textStyle').color || null

  return (
    <div className={`flex flex-wrap gap-1 p-2 border-b rounded-t ${
      isLight 
        ? 'bg-neutral-50 border-neutral-300' 
        : 'bg-neutral-900 border-neutral-700'
    }`}>
      {/* For Actions: Show task list first and prominently */}
      {isAction && (
        <>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={buttonClass(editor.isActive('taskList'))}
            title="Tasks - Convert to checkbox list"
            style={{ fontWeight: 'bold' }}
          >
            ☑ Tasks
          </button>
          <div className={dividerClass} />
        </>
      )}
      
      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Bold - Make text heavier (Cmd/Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Italic - Slant text (Cmd/Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive('underline'))}
        title="Underline - Add line below text (Cmd/Ctrl+U)"
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive('strike'))}
        title="Strikethrough - Cross out text"
      >
        <s>S</s>
      </button>

      <div className={dividerClass} />

      {/* Text Color Picker */}
      <div ref={colorPickerRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker)
            setShowHighlightPicker(false)
          }}
          className={buttonClass(!!currentColor)}
          title="Text Color - Change the color of selected text"
          style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          <span style={{ color: currentColor || 'inherit' }}>A</span>
          <span style={{ 
            width: '12px', 
            height: '3px', 
            background: currentColor || (isLight ? '#374151' : '#9CA3AF'),
            borderRadius: '1px',
            marginTop: '2px'
          }} />
        </button>
        
        {showColorPicker && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              background: isLight ? '#FFFFFF' : '#1F2937',
              border: `1px solid ${isLight ? '#E5E7EB' : '#374151'}`,
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 100,
              display: 'flex',
              gap: '4px',
            }}
          >
            {TEXT_COLORS.map(({ name, color }) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  if (color) {
                    editor.chain().focus().setColor(color).run()
                  } else {
                    editor.chain().focus().unsetColor().run()
                  }
                  setShowColorPicker(false)
                }}
                title={name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: color || (isLight ? '#374151' : '#9CA3AF'),
                  border: currentColor === color ? '2px solid #DC143C' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight Picker */}
      <div ref={highlightPickerRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker)
            setShowColorPicker(false)
          }}
          className={buttonClass(editor.isActive('highlight'))}
          title="Highlight - Add background color to text like a marker"
          style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          <span style={{ 
            background: editor.isActive('highlight') ? '#FEF08A' : 'transparent',
            padding: '0 2px',
            borderRadius: '2px',
          }}>
            ✏️
          </span>
        </button>
        
        {showHighlightPicker && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              background: isLight ? '#FFFFFF' : '#1F2937',
              border: `1px solid ${isLight ? '#E5E7EB' : '#374151'}`,
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 100,
              display: 'flex',
              gap: '4px',
            }}
          >
            {HIGHLIGHT_COLORS.map(({ name, color }) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color }).run()
                  setShowHighlightPicker(false)
                }}
                title={name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: color,
                  border: editor.isActive('highlight', { color }) ? '2px solid #DC143C' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
            {/* Remove highlight button */}
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run()
                setShowHighlightPicker(false)
              }}
              title="Remove Highlight"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: isLight ? '#F3F4F6' : '#374151',
                border: '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'transform 0.1s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className={dividerClass} />

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1 - Large title text"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2 - Section heading"
      >
        H2
      </button>

      <div className={dividerClass} />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Bullet List - Unordered list with dots"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Numbered List - Ordered list with numbers"
      >
        1.
      </button>
      {/* Task list button - already shown prominently for Actions above */}
      {!isAction && (
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={buttonClass(editor.isActive('taskList'))}
          title="Checklist - Add checkbox items"
        >
          ☑
        </button>
      )}

      <div className={dividerClass} />

      {/* Block Quote */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive('blockquote'))}
        title="Block Quote - Indent text as a quotation"
      >
        ❝
      </button>

      <div className={dividerClass} />

      {/* Phase 2: Collapsible/Details Section */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleDetails().run()}
        className={buttonClass(editor.isActive('details'))}
        title="Collapsible Section - Wrap selected text in an expandable/collapsible block. Click the header to toggle."
      >
        ▼
      </button>

      {/* Phase 3: Callout Blocks */}
      <div ref={calloutPickerRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setShowCalloutPicker(!showCalloutPicker)
            setShowColorPicker(false)
            setShowHighlightPicker(false)
          }}
          className={buttonClass(editor.isActive('callout'))}
          title="Callout Block - Add a highlighted box for insights 💡, questions ❓, warnings ⚠️, or notes ℹ️"
        >
          💡
        </button>
        
        {showCalloutPicker && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              background: isLight ? '#FFFFFF' : '#1F2937',
              border: `1px solid ${isLight ? '#E5E7EB' : '#374151'}`,
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '120px',
            }}
          >
            {(Object.keys(CALLOUT_TYPES) as CalloutType[]).map((type) => {
              const config = CALLOUT_TYPES[type]
              const tooltips: Record<CalloutType, string> = {
                insight: 'Insight - Highlight a key realization or important takeaway',
                question: 'Question - Mark something to explore or follow up on later',
                warning: 'Warning - Flag a risk, concern, or something to be careful about',
                note: 'Note - Add supplementary information or context',
              }
              return (
                <button
                  key={type}
                  type="button"
                  title={tooltips[type]}
                  onClick={() => {
                    editor.chain().focus().toggleCallout(type).run()
                    setShowCalloutPicker(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: editor.isActive('callout', { type }) 
                      ? (isLight ? config.lightBg : config.darkBg)
                      : 'transparent',
                    color: isLight ? '#374151' : '#D1D5DB',
                    fontSize: '14px',
                    transition: 'background 0.1s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isLight ? '#F3F4F6' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = editor.isActive('callout', { type }) 
                    ? (isLight ? config.lightBg : config.darkBg)
                    : 'transparent'
                  }
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              )
            })}
            {/* Remove callout button */}
            {editor.isActive('callout') && (
              <button
                type="button"
                title="Remove Callout - Convert back to regular text"
                onClick={() => {
                  editor.chain().focus().unsetCallout().run()
                  setShowCalloutPicker(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  border: `1px solid ${isLight ? '#E5E7EB' : '#4B5563'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: isLight ? '#6B7280' : '#9CA3AF',
                  fontSize: '14px',
                  marginTop: '4px',
                }}
              >
                <span>✕</span>
                <span>Remove</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className={dividerClass} />

      {/* Phase 4: Entry Link */}
      <button
        type="button"
        onClick={() => onOpenEntryPicker?.()}
        className={buttonClass(editor.isActive('entryLink'))}
        title="Link to Entry - Create a clickable link to another journal entry. Opens a search picker."
      >
        🔗
      </button>

      <div className={dividerClass} />

      {/* Phase 5: Indent/Outdent for outline structure */}
      <button
        type="button"
        onClick={() => {
          // Try to sink list item first, then indent blockquote if not in a list
          if (editor.can().sinkListItem('listItem')) {
            editor.chain().focus().sinkListItem('listItem').run()
          } else if (editor.can().sinkListItem('taskItem')) {
            editor.chain().focus().sinkListItem('taskItem').run()
          }
        }}
        className={buttonClass(false)}
        title="Indent - Nest list item deeper to create sub-items (Tab key also works)"
        disabled={!editor.can().sinkListItem('listItem') && !editor.can().sinkListItem('taskItem')}
        style={{
          opacity: (editor.can().sinkListItem('listItem') || editor.can().sinkListItem('taskItem')) ? 1 : 0.5,
        }}
      >
        →
      </button>
      <button
        type="button"
        onClick={() => {
          if (editor.can().liftListItem('listItem')) {
            editor.chain().focus().liftListItem('listItem').run()
          } else if (editor.can().liftListItem('taskItem')) {
            editor.chain().focus().liftListItem('taskItem').run()
          }
        }}
        className={buttonClass(false)}
        title="Outdent - Move list item up one level (Shift+Tab also works)"
        disabled={!editor.can().liftListItem('listItem') && !editor.can().liftListItem('taskItem')}
        style={{
          opacity: (editor.can().liftListItem('listItem') || editor.can().liftListItem('taskItem')) ? 1 : 0.5,
        }}
      >
        ←
      </button>
    </div>
  )
}

