import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { JournalPageClient } from '@/components/journal-page-client'
import { Entry, WeeklyTheme } from '@/types'
import { getCurrentWeeklyTheme } from '@/app/actions/entries'

async function getEntries(userId: string): Promise<Entry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading entries:', error)
    return []
  }

  return (data as Entry[]) || []
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const entries = await getEntries(user.id)
  const searchQuery = searchParams.search?.toLowerCase() || ''
  const currentTheme = await getCurrentWeeklyTheme(user.id)

  return (
    <JournalPageClient
      initialEntries={entries}
      initialSearchQuery={searchQuery}
      userId={user.id}
      initialWeeklyTheme={currentTheme}
    />
  )
}

