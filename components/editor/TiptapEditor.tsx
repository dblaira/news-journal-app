'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useCallback } from 'react'
import { Toolbar } from './Toolbar'

interface TiptapEditorProps {
  content: string
  onChange?: (html: string) => void
  onSave?: (html: string) => void
  editable?: boolean
  autoSaveDelay?: number
  variant?: 'light' | 'dark'
  placeholder?: string
  entryType?: 'story' | 'action' | 'note'
}

// Convert plain text lines to task list HTML for Actions
function convertToTaskList(content: string): string {
  // If content is already HTML with task list, return as-is
  if (content.includes('<ul data-type="taskList"') || content.includes('data-type="taskItem"')) {
    return content
  }
  
  // If content is plain text or simple paragraphs, convert to task list
  // Strip HTML tags to get plain text
  const plainText = content.replace(/<[^>]*>/g, '').trim()
  if (!plainText) return content
  
  // Split by lines and convert each to a task item
  const lines = plainText.split(/\n+/).filter(line => line.trim())
  if (lines.length === 0) return content
  
  const taskItems = lines.map(line => 
    `<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>${line.trim()}</p></div></li>`
  ).join('')
  
  return `<ul data-type="taskList">${taskItems}</ul>`
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
}: TiptapEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRenderRef = useRef(true)
  
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
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)

      // Debounced auto-save
      if (onSave && html !== lastSavedContentRef.current) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          onSave(html)
          lastSavedContentRef.current = html
        }, autoSaveDelay)
      }
    },
  })

  // Update content when prop changes (e.g., switching entries)
  // Skip on first render to preserve our task list conversion
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    if (editor && content !== editor.getHTML()) {
      // For actions, convert to task list; otherwise use as-is
      const newContent = entryType === 'action' ? convertToTaskList(content) : content
      editor.commands.setContent(newContent)
      lastSavedContentRef.current = newContent
    }
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
    <div className={`tiptap-editor border rounded overflow-hidden ${isLight ? 'border-neutral-300' : 'border-neutral-700'}`}>
      {editable && <Toolbar editor={editor} variant={variant} entryType={entryType} />}
      <EditorContent
        editor={editor}
        className={`tiptap-content p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none ${
          isLight 
            ? 'bg-white text-neutral-900' 
            : 'bg-neutral-900 text-white prose-invert'
        }`}
        data-placeholder={placeholder}
      />
    </div>
  )
}

// Export a ref-friendly version for accessing editor methods
export { TiptapEditor as default }

