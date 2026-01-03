'use client'

import { useState, useCallback, useRef } from 'react'
import { useReactFlow } from 'reactflow'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface NodeToolbarProps {
  nodeId: string
  position: { x: number; y: number }
}

const nodeTypeOptions = [
  { type: 'concept', color: '#DBEAFE', border: '#3B82F6' },
  { type: 'action', color: '#DCFCE7', border: '#22C55E' },
  { type: 'question', color: '#FEF3C7', border: '#F59E0B' },
  { type: 'theme', color: '#F3E8FF', border: '#A855F7' },
]

export default function NodeToolbar({ nodeId, position }: NodeToolbarProps) {
  const { setNodes, deleteElements, getNode } = useReactFlow()
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const node = getNode(nodeId)

  const updateNodeData = useCallback(
    (updates: Record<string, any>) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
        )
      )
    },
    [nodeId, setNodes]
  )

  const handleEmojiSelect = useCallback(
    (emojiData: EmojiClickData) => {
      updateNodeData({ emoji: emojiData.emoji })
      setShowEmojiPicker(false)
    },
    [updateNodeData]
  )

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Resize to small thumbnail
          const canvas = document.createElement('canvas')
          const maxSize = 64
          const scale = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = img.width * scale
          canvas.height = img.height * scale

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

          updateNodeData({ imageUrl: canvas.toDataURL('image/jpeg', 0.8) })
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },
    [updateNodeData]
  )

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id: nodeId }] })
  }, [nodeId, deleteElements])

  const clearEmoji = useCallback(() => {
    updateNodeData({ emoji: undefined })
  }, [updateNodeData])

  const clearImage = useCallback(() => {
    updateNodeData({ imageUrl: undefined })
  }, [updateNodeData])

  if (!node) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y - 60,
        transform: 'translateX(-50%)',
        background: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #E5E7EB',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000,
      }}
    >
      {/* Emoji button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            background: '#F9FAFB',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Add emoji"
        >
          {node.data.emoji || '😀'}
        </button>
        {node.data.emoji && (
          <button
            onClick={clearEmoji}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: 'none',
              background: '#EF4444',
              color: '#FFF',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        )}
        {showEmojiPicker && (
          <div style={{ position: 'absolute', top: '40px', left: 0, zIndex: 1001 }}>
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              width={280}
              height={350}
              searchDisabled
              skinTonesDisabled
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>

      {/* Image upload button */}
      <div style={{ position: 'relative' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            background: node.data.imageUrl ? 'transparent' : '#F9FAFB',
            cursor: 'pointer',
            padding: node.data.imageUrl ? '2px' : '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          title="Add image"
        >
          {node.data.imageUrl ? (
            <img
              src={node.data.imageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
            />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>
        {node.data.imageUrl && (
          <button
            onClick={clearImage}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: 'none',
              background: '#EF4444',
              color: '#FFF',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />

      {/* Node type color swatches */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {nodeTypeOptions.map(({ type, color, border }) => (
          <button
            key={type}
            onClick={() => updateNodeData({ nodeType: type })}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: `2px solid ${border}`,
              background: color,
              cursor: 'pointer',
              boxShadow: node.data.nodeType === type ? `0 0 0 2px ${border}` : 'none',
              transform: node.data.nodeType === type ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
          />
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />

      {/* Delete button */}
      <button
        onClick={handleDelete}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid #FEE2E2',
          background: '#FEF2F2',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Delete node"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  )
}

