'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { useEffect, useRef, useCallback, useState } from 'react'
import { Toolbar } from './Toolbar'
import { Details, Callout, EntryLink } from './extensions'
import { EntryPickerModal } from './EntryPickerModal'

interface TiptapEditorProps {
  content: string
  onChange?: (html: string) => void
  onSave?: (html: string) => void
  editable?: boolean
  autoSaveDelay?: number
  variant?: 'light' | 'dark'
  placeholder?: string
  entryType?: 'story' | 'action' | 'note'
  currentEntryId?: string // For excluding current entry from link picker
}

// Convert plain text lines to task list HTML for Actions
function convertToTaskList(content: string): string {
  // If content is already HTML with task list, return as-is
  if (content.includes('<ul data-type="taskList"') || content.includes('data-type="taskItem"')) {
    return content
  }
  
  // If content is plain text or simple paragraphs, convert to task list
  // Replace paragraph/div/br tags with newlines BEFORE stripping HTML
  const withNewlines = content
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<div>/gi, '')
  const plainText = withNewlines.replace(/<[^>]*>/g, '').trim()
  
  if (!plainText) {
    return content
  }
  
  // Split by lines OR sentences/items if single line
  let lines = plainText.split(/\n+/).filter(line => line.trim())
  
  // If single line, try to split by commas, periods, or semicolons
  if (lines.length === 1) {
    // Try comma first (most common list separator)
    if (plainText.includes(',')) {
      const items = plainText.split(',').map(s => s.trim()).filter(s => s)
      if (items.length > 1) {
        lines = items
      }
    }
    // Try period (sentence-style tasks like "Buy groceries. Call mom.")
    else if ((plainText.match(/\./g) || []).length > 1) {
      // Only split if there are multiple periods (not just one at the end)
      const items = plainText.split('.').map(s => s.trim()).filter(s => s)
      if (items.length > 1) {
        lines = items
      }
    }
    // Try semicolon
    else if (plainText.includes(';')) {
      const items = plainText.split(';').map(s => s.trim()).filter(s => s)
      if (items.length > 1) {
        lines = items
      }
    }
  }
  
  if (lines.length === 0) {
    return content
  }
  
  // Use simpler HTML structure that Tiptap TaskList expects
  const taskItems = lines.map(line => 
    `<li data-type="taskItem" data-checked="false"><p>${line.trim()}</p></li>`
  ).join('\n')
  
  return `<ul data-type="taskList">\n${taskItems}\n</ul>`
}

export function TiptapEditor({
  content,
  onChange,
  onSave,
  editable = true,
  autoSaveDelay = 2000,
  variant = 'dark',
  placeholder,
  entryType,
  currentEntryId,
}: TiptapEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRenderRef = useRef(true)
  const hasPendingChangesRef = useRef(false)
  const lastContentPropRef = useRef(content)
  const [showEntryPicker, setShowEntryPicker] = useState(false)
  
  // For Actions, convert content to task list format on initial render
  const initialContent = entryType === 'action' 
    ? convertToTaskList(content)
    : content
  
  const lastSavedContentRef = useRef(initialContent)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || (entryType === 'action' ? 'Add your tasks...' : 'Write something...'),
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      // Phase 2: Collapsible sections
      Details,
      // Phase 3: Semantic callouts
      Callout,
      // Phase 4: Entry links
      EntryLink.configure({
        openOnClick: false, // We handle clicks ourselves
      }),
    ],
    content: initialContent,
    editable,
    immediatelyRender: false, // Prevent SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)

      // Mark that we have unsaved changes - prevents prop sync from overwriting
      hasPendingChangesRef.current = true

      // Debounced auto-save
      if (onSave && html !== lastSavedContentRef.current) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          onSave(html)
          lastSavedContentRef.current = html
          // Clear pending flag ONLY if content matches what we just saved
          // This prevents race conditions where user types during save
          setTimeout(() => {
            if (editor.getHTML() === html) {
              hasPendingChangesRef.current = false
            }
          }, 100)
        }, autoSaveDelay)
      }
    },
  })
  
  // Handler for entry link selection
  const handleEntrySelect = useCallback((entry: { id: string; headline: string }) => {
    if (editor) {
      editor.chain().focus().setEntryLink(entry.id, entry.headline).run()
    }
  }, [editor])

  // Update content when prop changes (e.g., switching entries)
  // Skip on first render to preserve our task list conversion
  // Skip if user has pending changes to prevent cursor reset during auto-save
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      lastContentPropRef.current = content
      return
    }
    
    // Don't sync if user has unsaved changes - this prevents cursor reset
    // when auto-save triggers a parent state update
    if (hasPendingChangesRef.current) {
      lastContentPropRef.current = content
      return
    }
    
    // Also check if editor is focused - user might be typing without triggering onUpdate yet
    if (editor?.isFocused) {
      lastContentPropRef.current = content
      return
    }
    
    if (editor && content !== editor.getHTML()) {
      // For actions, convert to task list; otherwise use as-is
      const newContent = entryType === 'action' ? convertToTaskList(content) : content
      editor.commands.setContent(newContent)
      lastSavedContentRef.current = newContent
    }
    lastContentPropRef.current = content
  }, [content, editor, entryType])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Method to get current HTML content
  const getHTML = useCallback(() => {
    return editor?.getHTML() || ''
  }, [editor])

  // Method to manually trigger save
  const triggerSave = useCallback(() => {
    if (editor && onSave) {
      const html = editor.getHTML()
      onSave(html)
      lastSavedContentRef.current = html
    }
  }, [editor, onSave])

  const isLight = variant === 'light'
  
  return (
    <div className={`tiptap-editor border rounded overflow-hidden ${isLight ? 'border-neutral-300 light-variant' : 'border-neutral-700'}`}>
      {editable && (
        <Toolbar 
          editor={editor} 
          variant={variant} 
          entryType={entryType}
          onOpenEntryPicker={() => setShowEntryPicker(true)}
        />
      )}
      <EditorContent
        editor={editor}
        className={`tiptap-content p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none ${
          isLight 
            ? 'bg-white text-neutral-900' 
            : 'bg-neutral-900 text-white prose-invert'
        }`}
        data-placeholder={placeholder}
      />
      
      {/* Entry Picker Modal for internal links */}
      <EntryPickerModal
        isOpen={showEntryPicker}
        onClose={() => setShowEntryPicker(false)}
        onSelect={handleEntrySelect}
        variant={variant}
        excludeEntryId={currentEntryId}
      />
    </div>
  )
}

// Export a ref-friendly version for accessing editor methods
export { TiptapEditor as default }

