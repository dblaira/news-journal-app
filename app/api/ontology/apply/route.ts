import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OntologyParent } from '@/types/extraction'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const ontology: OntologyParent[] = body.ontology

    if (!ontology || !Array.isArray(ontology) || ontology.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty ontology array' },
        { status: 400 }
      )
    }

    console.log('=== Ontology Apply START ===')
    console.log(`Parents to write: ${ontology.length}`)

    const totalChildren = ontology.reduce((sum, g) => sum + g.children.length, 0)
    console.log(`Total child mappings: ${totalChildren}`)

    // 1. Write ontology_categories rows
    const ontologyRows = ontology.flatMap(group =>
      group.children.map(child => ({
        user_id: user.id,
        parent_name: group.parent,
        child_label: child,
        description: group.description || null,
        version: 1,
      }))
    )

    const { error: insertError } = await supabase
      .from('ontology_categories')
      .upsert(ontologyRows, { onConflict: 'user_id,child_label,version' })

    if (insertError) {
      console.error('Ontology insert error:', insertError)
      return NextResponse.json(
        { error: `Failed to write ontology: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log(`Wrote ${ontologyRows.length} ontology_categories rows`)

    // 2. Backfill parent_category on extractions
    let totalExtractionsUpdated = 0
    const perParent: Record<string, number> = {}

    for (const group of ontology) {
      if (group.children.length === 0) continue

      const { data: updatedRows, error: updateError } = await supabase
        .from('extractions')
        .update({ parent_category: group.parent })
        .eq('user_id', user.id)
        .in('category', group.children)
        .select('id')

      if (updateError) {
        console.error(`Update error for parent "${group.parent}":`, updateError)
        continue
      }

      const updated = updatedRows?.length ?? 0
      totalExtractionsUpdated += updated
      perParent[group.parent] = updated
      console.log(`  ${group.parent}: ${updated} extractions updated`)
    }

    console.log(`\n=== Ontology Apply Result ===`)
    console.log(`Total mappings written: ${ontologyRows.length}`)
    console.log(`Total extractions updated: ${totalExtractionsUpdated}`)
    console.log(`Per parent:`, JSON.stringify(perParent, null, 2))
    console.log('=== Ontology Apply END ===')

    return NextResponse.json({
      total_mappings: ontologyRows.length,
      total_extractions_updated: totalExtractionsUpdated,
      per_parent: perParent,
    })
  } catch (error) {
    console.error('Ontology apply error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
