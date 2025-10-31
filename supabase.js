import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://wqdacfrzurhpsiuvzxwo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZGFjZnJ6dXJocHNpdXZ6eHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTkxMTYsImV4cCI6MjA2MjAzNTExNn0.IuiHf6TYw2Uh8RK4FPTdyST94l_ndB0h1vqkJEYqmE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)