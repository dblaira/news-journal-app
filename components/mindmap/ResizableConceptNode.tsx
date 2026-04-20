'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeResizer } from '@reactflow/node-resizer'
import '@reactflow/node-resizer/dist/style.css'

export interface ConceptNodeData {
  label: string
  description?: string
  nodeType: 'concept' | 'action' | 'question' | 'theme'
  emoji?: string
  imageUrl?: string
}

const styles: Record<string, { bg: string; border: string; text: string }> = {
  concept: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  action: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
  question: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  theme: { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },
}

function ResizableConceptNode({ data, selected }: NodeProps<ConceptNodeData>) {
  const style = styles[data.nodeType] || styles.concept

  return (
    <>
      <NodeResizer
        minWidth={100}
        minHeight={50}
        isVisible={selected}
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded"
      />

      <div
        style={{
          height: '100%',
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: `2px solid ${style.border}`,
          background: style.bg,
          boxShadow: selected 
            ? `0 0 0 2px ${style.border}, 0 2px 4px rgba(0,0,0,0.1)` 
            : '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Emoji or Image */}
        {(data.emoji || data.imageUrl) && (
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {data.emoji && (
              <span style={{ fontSize: '1.25rem' }}>{data.emoji}</span>
            )}
            {data.imageUrl && (
              <img
                src={data.imageUrl}
                alt=""
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
            )}
          </div>
        )}

        {/* Label */}
        <div
          style={{
            fontWeight: 600,
            fontSize: '0.9rem',
            color: style.text,
            marginBottom: data.description ? '4px' : 0,
          }}
        >
          {data.label}
        </div>

        {/* Description */}
        {data.description && (
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6B7280',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.description}
          </div>
        )}
      </div>

      {/* Connection handles on all 4 sides */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 8, height: 8, background: style.border }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 8, height: 8, background: style.border }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 8, height: 8, background: style.border }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 8, height: 8, background: style.border }}
      />
    </>
  )
}

export default memo(ResizableConceptNode)

