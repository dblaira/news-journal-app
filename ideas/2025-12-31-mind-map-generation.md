---
title: "Mind Map Generation from Linear Text"
label: Product Capability
importance: high
alignment: adjacent
status: idea
created: 2025-12-31
updated: 2025-12-31

# Optional context (if available)
time:
location:
activity:
---

## Summary

Add automated mind map generation from linear text input. User captures via voice/text, AI generates node/edge structure, React Flow renders interactive canvas. Transforms journal entries, notes, and actions into visual concept maps.

## Problem/Opportunity

Linear text captures (stories, notes, actions) don't reveal relationships between concepts. Mind maps help users:
- See connections they missed while writing
- Organize complex thoughts visually
- Navigate their ideas spatially
- Identify themes and patterns across entries

This would differentiate Personal Press from simple journaling apps by adding a thinking/analysis layer.

## Possible Approach

### Data Structure

**Supabase Tables:**

```sql
-- Mind maps table
create table mind_maps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  source_entry_id uuid references entries(id), -- links to original story/note/action
  source_text text, -- original linear input
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Nodes table
create table mind_map_nodes (
  id uuid default gen_random_uuid() primary key,
  mind_map_id uuid references mind_maps(id) on delete cascade,
  label text not null,
  description text, -- optional context
  position_x float default 0,
  position_y float default 0,
  node_type text default 'concept', -- 'concept', 'action', 'question', 'theme'
  priority text, -- links to user's priority system if relevant
  created_at timestamp with time zone default now()
);

-- Edges table (relationships between nodes)
create table mind_map_edges (
  id uuid default gen_random_uuid() primary key,
  mind_map_id uuid references mind_maps(id) on delete cascade,
  source_node_id uuid references mind_map_nodes(id) on delete cascade,
  target_node_id uuid references mind_map_nodes(id) on delete cascade,
  relationship_type text, -- 'causes', 'supports', 'contrasts', 'contains', 'related'
  label text, -- optional edge label
  created_at timestamp with time zone default now()
);
```

**TypeScript Types:**

```typescript
// types/mindmap.ts

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  position: { x: number; y: number };
  nodeType: 'concept' | 'action' | 'question' | 'theme';
  priority?: string;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: 'causes' | 'supports' | 'contrasts' | 'contains' | 'related';
  label?: string;
}

export interface MindMap {
  id: string;
  title: string;
  sourceText: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface ReactFlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    nodeType: string;
    priority?: string;
  };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
}
```

### LLM Prompt

```typescript
const MIND_MAP_SYSTEM_PROMPT = `You are a mind map generator. Given linear text input, extract key concepts and their relationships.

Output valid JSON only, no other text.

Rules:
1. Extract 3-10 key concepts as nodes (fewer is better)
2. Label nodes with short phrases (2-5 words)
3. Identify relationships between nodes
4. Assign node types: concept (default), action (something to do), question (unresolved), theme (overarching pattern)
5. Position nodes roughly: central concepts near 0,0, related concepts clustered, opposing concepts distant

Output schema:
{
  "title": "brief title for this mind map",
  "nodes": [
    {
      "id": "node_1",
      "label": "Short Label",
      "description": "Optional longer context",
      "position": { "x": 0, "y": 0 },
      "nodeType": "concept"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "relationshipType": "supports",
      "label": "optional edge label"
    }
  ]
}

Relationship types:
- causes: A leads to B
- supports: A reinforces B
- contrasts: A opposes or tensions with B
- contains: A is a subset or example of B
- related: general connection`;
```

### API Route

```typescript
// app/api/generate-mindmap/route.ts

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { text } = await request.json();
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: MIND_MAP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a mind map from this text:\n\n${text}`
      }
    ]
  });
  
  const content = message.content[0];
  if (content.type === 'text') {
    const mindMap = JSON.parse(content.text);
    return NextResponse.json(mindMap);
  }
  
  return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
}
```

### React Flow Component

```typescript
// components/MindMapCanvas.tsx

'use client';

import { useCallback } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

function ConceptNode({ data }: { data: any }) {
  const bgColors: Record<string, string> = {
    concept: 'bg-blue-100 border-blue-300',
    action: 'bg-green-100 border-green-300',
    question: 'bg-yellow-100 border-yellow-300',
    theme: 'bg-purple-100 border-purple-300',
  };
  
  return (
    <div className={`px-4 py-2 rounded-lg border-2 shadow-sm ${bgColors[data.nodeType] || bgColors.concept}`}>
      <div className="font-medium text-sm">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-600 mt-1">{data.description}</div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { concept: ConceptNode };

export default function MindMapCanvas({ initialNodes, initialEdges }) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-[600px] bg-gray-50 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

### Installation

```bash
npm install reactflow
```

## Notes

**Implementation priorities:**
1. Start simple: Get basic generation + display working before adding edit/save
2. Position algorithm: LLM positions will be rough—consider running a force-directed layout on first render
3. Mobile: React Flow works on mobile but drag UX is different—test on phone
4. Batch with rewrites: If generating mind map from new capture, batch the API call with existing rewrite calls to reduce latency
5. Edge labels: Often noisy—consider hiding by default, show on hover

**Usage flows:**
- Generate from existing entry (button on story/note)
- Generate from new capture (canvas capture mode)
- Manual creation (empty canvas, user adds nodes)

**Dependencies:** reactflow

**Estimated effort:** Medium-large (new feature with database, API, UI)

---

### Core Loop

```
Linear text in → Anthropic API generates JSON with nodes/edges/positions
→ Utility function converts to React Flow format
→ Canvas renders with draggable nodes
→ User rearranges → positions saved back to Supabase
```

### Key Decisions

**Node positioning:** The LLM will guess at node positions, but they'll be rough. Options:
1. Accept "good enough" LLM placement (start here)
2. Run force-directed layout algorithm on first render (dagre or elkjs—not included in React Flow)

Recommendation: Start without layout library, see if LLM positioning is acceptable.

**Batching opportunity:** When capturing new text that needs both rewrites AND mind map generation, make a single API call that returns both. Saves latency and cost.

**Model selection:** Spec uses Sonnet for generation. For structured JSON output like this, Sonnet is plenty—save Opus for synthesis tasks.

### Platform Notes

**Mobile:** React Flow works on phone but drag experience is touchier. Fine for viewing and light editing—real rearrangement work will happen on Mac.

