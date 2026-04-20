import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = []
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  console.error('Missing Supabase environment variables:', missingVars.join(', '))
  console.error('Current env:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
  })
  
  throw new Error(
    `Missing Supabase environment variables: ${missingVars.join(', ')}. Please set these in your Vercel environment variables.`
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

