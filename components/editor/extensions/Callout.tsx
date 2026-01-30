'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'

// Callout types with their visual styling
export const CALLOUT_TYPES = {
  insight: {
    icon: '💡',
    label: 'Insight',
    lightBg: '#FEF9C3',
    darkBg: '#422006',
    lightBorder: '#FDE047',
    darkBorder: '#CA8A04',
    lightText: '#713F12',
    darkText: '#FEF08A',
  },
  question: {
    icon: '❓',
    label: 'Question',
    lightBg: '#DBEAFE',
    darkBg: '#1E3A5F',
    lightBorder: '#93C5FD',
    darkBorder: '#3B82F6',
    lightText: '#1E40AF',
    darkText: '#BFDBFE',
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    lightBg: '#FEE2E2',
    darkBg: '#450A0A',
    lightBorder: '#FCA5A5',
    darkBorder: '#DC2626',
    lightText: '#991B1B',
    darkText: '#FECACA',
  },
  note: {
    icon: 'ℹ️',
    label: 'Note',
    lightBg: '#E0E7FF',
    darkBg: '#1E1B4B',
    lightBorder: '#A5B4FC',
    darkBorder: '#6366F1',
    lightText: '#3730A3',
    darkText: '#C7D2FE',
  },
} as const

export type CalloutType = keyof typeof CALLOUT_TYPES

// React component for the callout view
function CalloutComponent({ node, updateAttributes }: any) {
  const calloutType = node.attrs.type as CalloutType
  const config = CALLOUT_TYPES[calloutType] || CALLOUT_TYPES.note
  
  // Detect light/dark mode from parent
  const isLight = typeof document !== 'undefined' && 
    document.querySelector('.tiptap-content')?.classList.contains('bg-white')
  
  return (
    <NodeViewWrapper className="callout-wrapper" style={{ margin: '12px 0' }}>
      <div
        data-callout={calloutType}
        style={{
          background: isLight ? config.lightBg : config.darkBg,
          border: `1px solid ${isLight ? config.lightBorder : config.darkBorder}`,
          borderRadius: '8px',
          padding: '12px 16px',
          color: isLight ? config.lightText : config.darkText,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
        <NodeViewContent 
          className="callout-content" 
          style={{ 
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        />
      </div>
    </NodeViewWrapper>
  )
}

// Callout extension for semantic blocks
export const Callout = Node.create({
  name: 'callout',
  
  group: 'block',
  
  content: 'block+',
  
  defining: true,
  
  addAttributes() {
    return {
      type: {
        default: 'note',
        parseHTML: element => element.getAttribute('data-callout') || 'note',
        renderHTML: attributes => ({
          'data-callout': attributes.type,
        }),
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    const calloutType = HTMLAttributes['data-callout'] as CalloutType || 'note'
    const config = CALLOUT_TYPES[calloutType]
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': calloutType,
        class: `callout callout-${calloutType}`,
        style: `
          background: ${config.lightBg};
          border: 1px solid ${config.lightBorder};
          border-radius: 8px;
          padding: 12px 16px;
          margin: 12px 0;
        `,
      }),
      [
        'div',
        { 
          class: 'callout-header',
          style: 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600;'
        },
        `${config.icon} ${config.label}`,
      ],
      ['div', { class: 'callout-content' }, 0],
    ]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },
  
  addCommands() {
    return {
      setCallout: (type: CalloutType) => ({ commands }) => {
        return commands.wrapIn(this.name, { type })
      },
      toggleCallout: (type: CalloutType) => ({ commands, state }) => {
        const { selection } = state
        const { $from } = selection
        
        // Check if we're already in a callout
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d)
          if (node.type.name === 'callout') {
            if (node.attrs.type === type) {
              // Same type, unwrap
              return commands.lift(this.name)
            } else {
              // Different type, change it
              return commands.updateAttributes(this.name, { type })
            }
          }
        }
        
        // Wrap in callout
        return commands.wrapIn(this.name, { type })
      },
      unsetCallout: () => ({ commands }) => {
        return commands.lift(this.name)
      },
    }
  },
})
