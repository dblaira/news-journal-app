'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateEntryInput, WeeklyTheme, Entry } from '@/types'

export async function createEntry(input: CreateEntryInput) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('entries')
    .insert([
      {
        ...input,
        user_id: user.id,
        versions: null,
        generating_versions: false,
      },
    ])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { data }
}

export async function deleteEntry(id: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateEntryVersions(id: string, versions: any[], generating: boolean) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('entries')
    .update({
      versions,
      generating_versions: generating,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateEntryContent(entryId: string, content: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('entries')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { data, success: true }
}

export async function generateWeeklyTheme(entryIds: string[]) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (entryIds.length !== 7) {
    return { error: 'Exactly 7 entry IDs are required' }
  }

  try {
    console.log('Starting weekly theme generation for user:', user.id)
    console.log('Entry IDs:', entryIds)
    
    // Import and call the logic directly instead of making an HTTP request
    console.log('Importing generateWeeklyThemeLogic...')
    const { generateWeeklyThemeLogic } = await import('@/lib/ai/generate-weekly-theme.server')
    console.log('Import successful, calling generateWeeklyThemeLogic...')
    
    const theme = await generateWeeklyThemeLogic(entryIds, user.id)
    console.log('Theme generated successfully:', theme.id)
    
    revalidatePath('/')
    return { data: theme }
  } catch (error) {
    console.error('Error generating weekly theme:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', { errorMessage, errorStack })
    
    // Check if it's a fetch error and provide more context
    if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      return { error: `API call failed: ${errorMessage}. Check Vercel function logs for details.` }
    }
    return { error: errorMessage }
  }
}

export async function getWeeklyThemes(userId: string): Promise<WeeklyTheme[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('weekly_themes')
    .select('*')
    .eq('user_id', userId)
    .order('week_start_date', { ascending: false })

  if (error) {
    console.error('Error fetching weekly themes:', error)
    return []
  }

  return (data as WeeklyTheme[]) || []
}

export async function getCurrentWeeklyTheme(userId: string): Promise<WeeklyTheme | null> {
  const supabase = await createClient()
  
  // Calculate current week start (Monday)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(now.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('weekly_themes')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartStr)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No theme found for this week
      return null
    }
    console.error('Error fetching current weekly theme:', error)
    return null
  }

  return data as WeeklyTheme
}

export async function incrementViewCount(entryId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Use atomic database function to avoid race conditions
  // This prevents the read-modify-write race where concurrent requests
  // could read the same value and both increment to the same result
  const { data: updated, error } = await supabase
    .rpc('increment_entry_view_count', {
      entry_id: entryId,
      owner_id: user.id,
    })

  if (error) {
    return { error: error.message }
  }

  // The function returns false if no rows were updated (entry not found)
  if (!updated) {
    return { error: 'Entry not found or was deleted' }
  }

  return { success: true }
}

export async function getLatestEntryPerCategory(userId: string): Promise<Entry[]> {
  const supabase = await createClient()
  const categories: Entry['category'][] = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']
  
  const entries: Entry[] = []
  
  for (const category of categories) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (!error && data) {
      entries.push(data as Entry)
    }
  }
  
  return entries
}

export async function getTrendingEntries(userId: string, limit: number = 10): Promise<Entry[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('view_count', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching trending entries:', error)
    return []
  }
  
  return (data as Entry[]) || []
}

export async function getLatestEntries(userId: string, limit: number = 20): Promise<Entry[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching latest entries:', error)
    return []
  }
  
  return (data as Entry[]) || []
}

export async function removeEntryPhoto(entryId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Update entry to remove photo URL
  const { error } = await supabase
    .from('entries')
    .update({
      photo_url: null,
      photo_processed: false,
    })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateEntryPhoto(entryId: string, photoUrl: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('entries')
    .update({
      photo_url: photoUrl,
      photo_processed: true,
    })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

// =============================================================================
// PIN FEATURE
// =============================================================================

export async function togglePin(entryId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // First, get the entry to check its current pin state and entry_type
  const { data: entry, error: fetchError } = await supabase
    .from('entries')
    .select('id, entry_type, pinned_at')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !entry) {
    return { error: 'Entry not found' }
  }

  // Default to 'story' if entry_type is not set (legacy entries)
  const entryType = entry.entry_type || 'story'

  // If already pinned, unpin it
  if (entry.pinned_at) {
    const { error: updateError } = await supabase
      .from('entries')
      .update({ pinned_at: null })
      .eq('id', entryId)
      .eq('user_id', user.id)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath('/')
    return { success: true, pinned: false }
  }

  // If not pinned, check how many are already pinned for this entry_type
  const { count, error: countError } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('entry_type', entryType)
    .not('pinned_at', 'is', null)

  if (countError) {
    return { error: countError.message }
  }

  // Maximum 2 pinned items per entry type
  if (count !== null && count >= 2) {
    return { error: `Maximum 2 pinned ${entryType}s allowed. Unpin one first.` }
  }

  // Pin the entry
  const { error: pinError } = await supabase
    .from('entries')
    .update({ pinned_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (pinError) {
    return { error: pinError.message }
  }

  revalidatePath('/')
  return { success: true, pinned: true }
}

export async function getPinnedEntries(userId: string): Promise<{
  stories: Entry[]
  notes: Entry[]
  actions: Entry[]
}> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .not('pinned_at', 'is', null)
    .order('pinned_at', { ascending: false })

  if (error) {
    console.error('Error fetching pinned entries:', error)
    return { stories: [], notes: [], actions: [] }
  }

  const entries = (data as Entry[]) || []
  
  // Default undefined entry_type to 'story' for legacy entries
  return {
    stories: entries.filter(e => (e.entry_type || 'story') === 'story'),
    notes: entries.filter(e => e.entry_type === 'note'),
    actions: entries.filter(e => e.entry_type === 'action'),
  }
}

