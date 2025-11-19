'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateEntryInput, WeeklyTheme } from '@/types'

export async function createEntry(input: CreateEntryInput) {
  const supabase = createClient()
  
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
  const supabase = createClient()
  
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
  const supabase = createClient()
  
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

export async function generateWeeklyTheme(entryIds: string[]) {
  const supabase = createClient()
  
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
  const supabase = createClient()
  
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
  const supabase = createClient()
  
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

