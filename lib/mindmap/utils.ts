import dagre from 'dagre'
import { MindMap, MindMapNode, MindMapEdge, ReactFlowNode, ReactFlowEdge } from '@/types'

// Auto-layout nodes using dagre algorithm
export function getLayoutedElements(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ 
    rankdir: direction, 
    nodesep: 80,  // horizontal spacing between nodes
    ranksep: 100, // vertical spacing between ranks
  })

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    // Estimate node dimensions based on content
    const hasDescription = node.data.description && node.data.description.length > 0
    const width = Math.max(150, Math.min(200, node.data.label.length * 10))
    const height = hasDescription ? 70 : 50
    g.setNode(node.id, { width, height })
  })

  // Add edges to dagre graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  // Run dagre layout
  dagre.layout(g)

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const width = nodeWithPosition.width || 150
    const height = nodeWithPosition.height || 50
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

// Convert LLM output to React Flow format with auto-layout
export function toReactFlowFormat(mindMap: MindMap): {
  nodes: ReactFlowNode[]
  edges: ReactFlowEdge[]
} {
  const nodes: ReactFlowNode[] = mindMap.nodes.map((node) => ({
    id: node.id,
    type: 'concept', // use custom node type
    position: node.position, // will be replaced by dagre
    data: {
      label: node.label,
      description: node.description,
      nodeType: node.nodeType,
      priority: node.priority,
    },
  }))

  const edges: ReactFlowEdge[] = mindMap.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep', // or 'straight', 'step', 'bezier'
    animated: edge.relationshipType === 'causes', // animate causal relationships
  }))

  // Apply dagre auto-layout for clean arrangement
  return getLayoutedElements(nodes, edges, 'TB')
}

// Convert React Flow state back to storage format
export function fromReactFlowFormat(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[]
): { nodes: MindMapNode[]; edges: MindMapEdge[] } {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      description: node.data.description,
      position: node.position,
      nodeType: (node.data.nodeType as MindMapNode['nodeType']) || 'concept',
      priority: node.data.priority,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationshipType: 'related' as const, // simplified for now
      label: typeof edge.label === 'string' ? edge.label : undefined,
    })),
  }
}

// Generate mind map from text via API
export async function generateMindMap(text: string, entryId?: string): Promise<MindMap> {
  const response = await fetch('/api/generate-mindmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, entryId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate mind map')
  }

  return response.json()
}

