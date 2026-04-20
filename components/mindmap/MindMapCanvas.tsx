'use client'

import { useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes,
  BackgroundVariant,
  OnSelectionChangeParams,
  ReactFlowInstance,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import '@reactflow/node-resizer/dist/style.css'

import ResizableConceptNode from './ResizableConceptNode'
import OrganicEdge from './OrganicEdge'
import NodeToolbar from './NodeToolbar'

const nodeTypes: NodeTypes = {
  concept: ResizableConceptNode,
}

const edgeTypes: EdgeTypes = {
  organic: OrganicEdge,
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
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  onClose,
}: MindMapCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  // Handle new connections with organic edge type
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'organic',
        data: { relationshipType: 'related' },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  // Track selected node for toolbar
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
    setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null)
  }, [])

  // Notify parent of node changes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      console.log('Node moved:', node.id, node.position)
      onNodesChangeProp?.(nodes)
    },
    [nodes, onNodesChangeProp]
  )

  // Double-click on canvas to create new node
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!reactFlowInstance) return

      const bounds = (event.target as HTMLElement).getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'concept',
        position,
        data: {
          label: 'New idea',
          nodeType: 'concept',
        },
        style: { width: 150, height: 60 },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance, setNodes]
  )

  // Get node center position for toolbar
  const getNodeCenter = useCallback((node: Node) => {
    const width = (node.style?.width as number) || node.width || 150
    return {
      x: node.position.x + width / 2,
      y: node.position.y,
    }
  }, [])

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
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
          Node Types
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: '#DBEAFE',
                border: '1px solid #3B82F6',
              }}
            />
            <span>Concept</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: '#DCFCE7',
                border: '1px solid #22C55E',
              }}
            />
            <span>Action</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
              }}
            />
            <span>Question</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: '#F3E8FF',
                border: '1px solid #A855F7',
              }}
            />
            <span>Theme</span>
          </div>
        </div>
        <div
          style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #E5E7EB',
            fontSize: '0.7rem',
            color: '#6B7280',
          }}
        >
          Double-click canvas to add node
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
            Drag nodes to rearrange • Scroll to zoom • Double-click to add • Select node to edit
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
        <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          onInit={setReactFlowInstance}
          onDoubleClick={onPaneDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'organic' }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid
          snapGrid={[15, 15]}
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

        {/* Node editing toolbar */}
        {selectedNode && (
          <NodeToolbar
            nodeId={selectedNode.id}
            position={getNodeCenter(selectedNode)}
          />
        )}

        {Legend}
        </ReactFlowProvider>
      </div>
    </div>
  )
}
