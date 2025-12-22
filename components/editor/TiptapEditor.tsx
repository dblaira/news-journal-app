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
}

export function TiptapEditor({
  content,
  onChange,
  onSave,
  editable = true,
  autoSaveDelay = 2000,
  variant = 'dark',
  placeholder,
}: TiptapEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef(content)

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
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content,
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
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
      lastSavedContentRef.current = content
    }
  }, [content, editor])

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
      {editable && <Toolbar editor={editor} variant={variant} />}
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

