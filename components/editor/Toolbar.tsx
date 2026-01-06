'use client'

import { Editor } from '@tiptap/react'

interface ToolbarProps {
  editor: Editor | null
  variant?: 'light' | 'dark'
  entryType?: 'story' | 'action' | 'note'
}

export function Toolbar({ editor, variant = 'dark', entryType }: ToolbarProps) {
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
            title="Checkbox List"
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
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <s>S</s>
      </button>

      <div className={dividerClass} />

      {/* Headings - hide for Actions */}
      {!isAction && (
        <>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
          >
            H2
          </button>
          <div className={dividerClass} />
        </>
      )}

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        1.
      </button>
      {/* Task list button - already shown prominently for Actions above */}
      {!isAction && (
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={buttonClass(editor.isActive('taskList'))}
          title="Checkbox List"
        >
          ☑
        </button>
      )}
    </div>
  )
}

