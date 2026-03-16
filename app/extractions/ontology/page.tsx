import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OntologyReview } from '@/components/ontology-review'

export default async function OntologyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { count: totalExtractions } = await supabase
    .from('extractions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return <OntologyReview totalExtractions={totalExtractions ?? 0} />
}
