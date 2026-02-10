'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { getLineageTree } from '@/app/actions/entries'

// ── Custom node for the watershed visualization ──────────────────────

interface WatershedNodeData {
  headline: string
  entry_type: string
  created_at: string
  isFocus: boolean
  onClickNode?: (id: string) => void
}

function WatershedNode({ data, id }: { data: WatershedNodeData; id: string }) {
  const typeColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    story: { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC143C', label: '🏔️ Story' },
    note: { bg: '#EFF6FF', border: '#93C5FD', text: '#2563EB', label: '📝 Note' },
    action: { bg: '#FFFBEB', border: '#FCD34D', text: '#D97706', label: '⚡ Action' },
  }
  const colors = typeColors[data.entry_type] || typeColors.story

  return (
    <div
      onClick={() => data.onClickNode?.(id)}
      style={{
        padding: '0.75rem 1rem',
        background: data.isFocus ? colors.bg : '#fff',
        border: `2px solid ${data.isFocus ? colors.text : colors.border}`,
        borderRadius: '10px',
        minWidth: '160px',
        maxWidth: '220px',
        cursor: 'pointer',
        boxShadow: data.isFocus
          ? `0 0 0 3px ${colors.border}40, 0 4px 12px rgba(0,0,0,0.1)`
          : '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{
        fontSize: '0.55rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08rem',
        color: colors.text,
        marginBottom: '0.3rem',
      }}>
        {colors.label}
      </div>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#111',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {data.headline}
      </div>
      <div style={{
        fontSize: '0.55rem',
        color: '#9CA3AF',
        marginTop: '0.25rem',
      }}>
        {new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  watershed: WatershedNode,
}

// ── Layout: simple top-down tree ─────────────────────────────────────

interface TreeLayoutNode {
  id: string
  children: TreeLayoutNode[]
}

function buildLayoutTree(
  rootId: string,
  nodes: { id: string; source_entry_id: string | null }[]
): TreeLayoutNode {
  const childrenMap = new Map<string, string[]>()
  for (const n of nodes) {
    if (n.source_entry_id) {
      const siblings = childrenMap.get(n.source_entry_id) || []
      siblings.push(n.id)
      childrenMap.set(n.source_entry_id, siblings)
    }
  }

  function build(id: string): TreeLayoutNode {
    const kids = childrenMap.get(id) || []
    return { id, children: kids.map(build) }
  }

  return build(rootId)
}

function layoutTree(
  tree: TreeLayoutNode,
  x: number = 0,
  y: number = 0,
  positions: Map<string, { x: number; y: number }> = new Map(),
  nodeWidth: number = 200,
  xGap: number = 40,
  yGap: number = 100,
): { positions: Map<string, { x: number; y: number }>; width: number } {
  if (tree.children.length === 0) {
    positions.set(tree.id, { x, y })
    return { positions, width: nodeWidth }
  }

  let childX = x
  let totalWidth = 0
  for (let i = 0; i < tree.children.length; i++) {
    const result = layoutTree(tree.children[i], childX, y + yGap, positions, nodeWidth, xGap, yGap)
    childX += result.width + xGap
    totalWidth += result.width + (i < tree.children.length - 1 ? xGap : 0)
  }

  // Center this node above its children
  const firstChild = positions.get(tree.children[0].id)!
  const lastChild = positions.get(tree.children[tree.children.length - 1].id)!
  const centerX = (firstChild.x + lastChild.x) / 2

  positions.set(tree.id, { x: centerX, y })

  return { positions, width: Math.max(totalWidth, nodeWidth) }
}

// ── Main component ───────────────────────────────────────────────────

interface WatershedViewProps {
  entryId: string
  onViewEntry?: (id: string) => void
  onClose: () => void
}

function WatershedViewInner({ entryId, onViewEntry, onClose }: WatershedViewProps) {
  const [loading, setLoading] = useState(true)
  const [treeData, setTreeData] = useState<{
    nodes: { id: string; headline: string; entry_type: string; created_at: string; source_entry_id: string | null }[]
    edges: { id: string; source: string; target: string }[]
    rootId: string
    focusId: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getLineageTree(entryId).then((result) => {
      if (cancelled) return
      if (!result.error && result.nodes) {
        setTreeData({
          nodes: result.nodes,
          edges: result.edges!,
          rootId: result.rootId!,
          focusId: result.focusId!,
        })
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [entryId])

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!treeData || treeData.nodes.length === 0) {
      return { flowNodes: [], flowEdges: [] }
    }

    // Build layout
    const layoutTreeRoot = buildLayoutTree(treeData.rootId, treeData.nodes)
    const { positions } = layoutTree(layoutTreeRoot)

    const flowNodes: Node[] = treeData.nodes.map((n) => {
      const pos = positions.get(n.id) || { x: 0, y: 0 }
      return {
        id: n.id,
        type: 'watershed',
        position: pos,
        data: {
          headline: n.headline,
          entry_type: n.entry_type,
          created_at: n.created_at,
          isFocus: n.id === treeData.focusId,
          onClickNode: onViewEntry,
        },
      }
    })

    const flowEdges: Edge[] = treeData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94A3B8', strokeWidth: 2 },
    }))

    return { flowNodes, flowEdges }
  }, [treeData, onViewEntry])

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, , onEdgesChange] = useEdgesState(flowEdges)

  // Sync when data changes
  useEffect(() => {
    if (flowNodes.length > 0) {
      onNodesChange(flowNodes.map((n) => ({ type: 'reset' as const, item: n })))
      onEdgesChange(flowEdges.map((e) => ({ type: 'reset' as const, item: e })))
    }
  }, [flowNodes, flowEdges, onNodesChange, onEdgesChange])

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '2rem 3rem',
          textAlign: 'center',
          animation: 'toolbar-pop-in 0.2s ease-out',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏔️</div>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>Mapping the watershed...</p>
        </div>
      </div>
    )
  }

  if (!treeData || treeData.nodes.length <= 1) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            animation: 'toolbar-pop-in 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏔️</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>No lineage yet</h3>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
            This entry hasn&rsquo;t spawned or been spawned from other entries. Use the spawn buttons to start a cycle.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      background: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid #E5E7EB',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🏔️</span>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111' }}>
            Watershed View
          </h2>
          <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 500 }}>
            {treeData.nodes.length} {treeData.nodes.length === 1 ? 'entry' : 'entries'} in this cycle
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '0.4rem 1rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      {/* ReactFlow canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={true}
          nodesConnectable={false}
          zoomOnScroll={true}
          panOnScroll={true}
          minZoom={0.3}
          maxZoom={2}
        >
          <Controls position="bottom-left" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E7EB" />
        </ReactFlow>
      </div>
    </div>
  )
}

export function WatershedView(props: WatershedViewProps) {
  return (
    <ReactFlowProvider>
      <WatershedViewInner {...props} />
    </ReactFlowProvider>
  )
}
