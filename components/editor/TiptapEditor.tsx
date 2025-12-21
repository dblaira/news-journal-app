'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect, useRef, useCallback } from 'react'
import { Toolbar } from './Toolbar'

interface TiptapEditorProps {
  content: string
  onChange?: (html: string) => void
  onSave?: (html: string) => void
  editable?: boolean
  autoSaveDelay?: number
}

export function TiptapEditor({
  content,
  onChange,
  onSave,
  editable = true,
  autoSaveDelay = 2000,
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

  return (
    <div className="tiptap-editor border border-neutral-700 rounded overflow-hidden">
      {editable && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="tiptap-content bg-neutral-900 text-white p-4 min-h-[200px] prose prose-invert prose-sm max-w-none focus:outline-none"
      />
    </div>
  )
}

// Export a ref-friendly version for accessing editor methods
export { TiptapEditor as default }

