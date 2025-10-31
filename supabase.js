import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqdacfrzurhpsiuvzxwo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZGFjZnJ6dXJocHNpdXZ6eHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzQyNjcsImV4cCI6MjA3NzMxMDI2N30.IuiHf6TYw2UhB8Rk4FPTdySTg41_ndB0h1vqkJEYqmE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)