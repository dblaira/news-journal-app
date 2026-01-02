import { MindMap, MindMapNode, MindMapEdge, ReactFlowNode, ReactFlowEdge } from '@/types'

// Convert LLM output to React Flow format
export function toReactFlowFormat(mindMap: MindMap): {
  nodes: ReactFlowNode[]
  edges: ReactFlowEdge[]
} {
  const nodes: ReactFlowNode[] = mindMap.nodes.map((node) => ({
    id: node.id,
    type: 'concept', // use custom node type
    position: node.position,
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

  return { nodes, edges }
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

