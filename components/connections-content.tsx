'use client'

import { useMemo } from 'react'
import { Entry } from '@/types'
import { ConnectionHero } from './connection-hero'
import { ConnectionCarousel } from './connection-carousel'
import { ConnectionGridLayout } from './connection-grid-layout'

interface ConnectionsContentProps {
  entries: Entry[]
  lifeArea: string
  onViewEntry: (id: string) => void
  userId?: string
}

export function ConnectionsContent({ entries, lifeArea, onViewEntry, userId }: ConnectionsContentProps) {
  const entryLookup = useMemo(() => {
    const map = new Map<string, Entry>()
    for (const entry of entries) {
      map.set(entry.id, entry)
    }
    return map
  }, [entries])

  let connections = entries.filter(e => e.entry_type === 'connection')
  if (lifeArea !== 'all') {
    connections = connections.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
  }

  connections.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const pinnedConnections = connections
    .filter(c => !!c.pinned_at)
    .sort((a, b) => new Date(b.pinned_at!).getTime() - new Date(a.pinned_at!).getTime())

  const hasConnections = connections.length > 0
  const fallbackConnection = connections[0] || null

  if (!hasConnections) {
    return (
      <div style={{ background: '#000000' }}>
        <ConnectionHero
          pinnedConnections={[]}
          fallbackConnection={null}
          totalCount={0}
          lifeArea={lifeArea}
          entryLookup={entryLookup}
        />
      </div>
    )
  }

  return (
    <div style={{ background: '#000000' }}>
      <ConnectionHero
        pinnedConnections={pinnedConnections}
        fallbackConnection={fallbackConnection}
        totalCount={connections.length}
        lifeArea={lifeArea}
        entryLookup={entryLookup}
      />

      <ConnectionCarousel
        connections={connections}
        onViewEntry={onViewEntry}
        entryLookup={entryLookup}
      />

      <ConnectionGridLayout
        connections={connections}
        onViewEntry={onViewEntry}
        entryLookup={entryLookup}
        userId={userId}
      />
    </div>
  )
}
