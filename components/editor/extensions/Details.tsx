'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useState } from 'react'

// React component for the details block view
function DetailsComponent({ node, updateAttributes, editor }: any) {
  const [isOpen, setIsOpen] = useState(node.attrs.open)
  const isLight = document.querySelector('.tiptap-editor')?.classList.contains('light-variant')
  
  const toggleOpen = () => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    updateAttributes({ open: newOpen })
  }
  
  return (
    <NodeViewWrapper className="details-wrapper" style={{ margin: '8px 0' }}>
      <div
        style={{
          border: `1px solid ${isLight ? '#E5E7EB' : '#374151'}`,
          borderRadius: '8px',
          overflow: 'hidden',
          background: isLight ? '#F9FAFB' : '#1F2937',
        }}
      >
        <div
          onClick={toggleOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            background: isLight ? '#F3F4F6' : '#374151',
            borderBottom: isOpen ? `1px solid ${isLight ? '#E5E7EB' : '#4B5563'}` : 'none',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
              fontSize: '12px',
            }}
          >
            ▶
          </span>
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateAttributes({ summary: e.currentTarget.textContent })}
            style={{
              flex: 1,
              fontWeight: 500,
              outline: 'none',
            }}
          >
            {node.attrs.summary || 'Click to expand'}
          </span>
        </div>
        <div
          style={{
            padding: isOpen ? '12px' : '0 12px',
            maxHeight: isOpen ? '1000px' : '0',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            opacity: isOpen ? 1 : 0,
          }}
        >
          <NodeViewContent className="details-content" />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// Details extension for collapsible content
export const Details = Node.create({
  name: 'details',
  
  group: 'block',
  
  content: 'block+',
  
  defining: true,
  
  addAttributes() {
    return {
      summary: {
        default: 'Click to expand',
        parseHTML: element => element.querySelector('summary')?.textContent || 'Click to expand',
      },
      open: {
        default: false,
        parseHTML: element => element.hasAttribute('open'),
        renderHTML: attributes => {
          if (!attributes.open) return {}
          return { open: 'true' }
        },
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'details',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes),
      ['summary', {}, HTMLAttributes.summary || 'Click to expand'],
      ['div', { class: 'details-content' }, 0],
    ]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(DetailsComponent)
  },
  
  addCommands() {
    return {
      setDetails: () => ({ commands }) => {
        return commands.wrapIn(this.name)
      },
      toggleDetails: () => ({ commands, state }) => {
        const { selection } = state
        const { $from } = selection
        
        // Check if we're already in a details block
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'details') {
            // Unwrap from details
            return commands.lift(this.name)
          }
        }
        
        // Wrap in details
        return commands.wrapIn(this.name)
      },
    }
  },
})
