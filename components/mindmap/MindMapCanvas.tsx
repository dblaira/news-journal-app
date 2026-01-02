'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  BackgroundVariant,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom node component with color coding by type
function ConceptNode({ data }: { data: { label: string; description?: string; nodeType: string } }) {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    concept: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
    action: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
    question: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    theme: { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },
  }

  const style = styles[data.nodeType] || styles.concept

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: `2px solid ${style.border}`,
        background: style.bg,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '120px',
        maxWidth: '200px',
      }}
    >
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
      {data.description && (
        <div
          style={{
            fontSize: '0.75rem',
            color: '#6B7280',
            lineHeight: 1.3,
          }}
        >
          {data.description}
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  concept: ConceptNode,
}

interface MindMapCanvasProps {
  initialNodes: Node[]
  initialEdges: Edge[]
  title?: string
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
  onClose?: () => void
}

export default function MindMapCanvas({
  initialNodes,
  initialEdges,
  title,
  onNodesChange,
  onEdgesChange,
  onClose,
}: MindMapCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges)

  // Allow user to draw new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Notify parent of node position changes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      console.log('Node moved:', node.id, node.position)
      onNodesChange?.(nodes)
    },
    [nodes, onNodesChange]
  )

  // Legend component
  const Legend = useMemo(
    () => (
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '0.75rem',
          zIndex: 5,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Node Types</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#DBEAFE', border: '1px solid #3B82F6' }} />
            <span>Concept</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#DCFCE7', border: '1px solid #22C55E' }} />
            <span>Action</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#FEF3C7', border: '1px solid #F59E0B' }} />
            <span>Question</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#F3E8FF', border: '1px solid #A855F7' }} />
            <span>Theme</span>
          </div>
        </div>
      </div>
    ),
    []
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.9)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: '#1F2937',
          borderBottom: '1px solid #374151',
        }}
      >
        <div>
          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '1.25rem',
              fontWeight: 600,
              margin: 0,
            }}
          >
            🧠 {title || 'Mind Map'}
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Drag nodes to rearrange • Scroll to zoom • Drag canvas to pan
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: '#DC143C',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.6rem 1.2rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
          style={{ background: '#F9FAFB' }}
        >
          <Controls
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
          <MiniMap
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                concept: '#3B82F6',
                action: '#22C55E',
                question: '#F59E0B',
                theme: '#A855F7',
              }
              return colors[node.data?.nodeType] || '#3B82F6'
            }}
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E5E7EB" />
        </ReactFlow>
        {Legend}
      </div>
    </div>
  )
}

