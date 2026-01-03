'use client'

import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow'

const relationshipColors: Record<string, string> = {
  causes: '#ef4444',
  supports: '#22c55e',
  contrasts: '#f59e0b',
  contains: '#6366f1',
  related: '#6b7280',
}

export interface OrganicEdgeData {
  relationshipType?: 'causes' | 'supports' | 'contrasts' | 'contains' | 'related'
  label?: string
}

export default function OrganicEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}: EdgeProps<OrganicEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  })

  const relationshipType = data?.relationshipType || 'related'
  const strokeColor = relationshipColors[relationshipType]

  return (
    <>
      {/* Shadow layer for depth */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 8 : 6}
        strokeOpacity={0.15}
        style={{ filter: 'blur(2px)' }}
      />

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected ? 3 : 2,
          strokeLinecap: 'round',
        }}
      />

      {/* Edge label */}
      {data?.label && (
        <text
          x={labelX}
          y={labelY - 10}
          textAnchor="middle"
          fontSize={11}
          fill="#4B5563"
          style={{
            pointerEvents: 'none',
            fontWeight: 500,
          }}
        >
          {data.label}
        </text>
      )}
    </>
  )
}

