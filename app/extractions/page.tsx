import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Extraction } from '@/types/extraction'
import { ExtractionsReview } from '@/components/extractions-review'

interface BatchInfo {
  batch_id: string
  created_at: string
  count: number
}

export default async function ExtractionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch distinct batch IDs with their creation date and count
  const { data: allExtractions } = await supabase
    .from('extractions')
    .select('id, batch_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const batchMap = new Map<string, BatchInfo>()
  for (const ext of allExtractions || []) {
    if (!batchMap.has(ext.batch_id)) {
      batchMap.set(ext.batch_id, {
        batch_id: ext.batch_id,
        created_at: ext.created_at,
        count: 0,
      })
    }
    batchMap.get(ext.batch_id)!.count++
  }
  const batches: BatchInfo[] = Array.from(batchMap.values())

  // Fetch the most recent batch's extractions (or empty)
  let extractions: Extraction[] = []
  let activeBatchId: string | null = null

  if (batches.length > 0) {
    activeBatchId = batches[0].batch_id
    const { data } = await supabase
      .from('extractions')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', activeBatchId)
      .order('category', { ascending: true })

    extractions = (data as Extraction[]) || []
  }

  // Count total entries for context
  const { count: totalEntries } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <ExtractionsReview
      initialExtractions={extractions}
      initialBatchId={activeBatchId}
      batches={batches}
      totalEntries={totalEntries || 0}
    />
  )
}
