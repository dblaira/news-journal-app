import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect if already logged in
  if (user) {
    redirect('/')
  }

  return <AuthForm />
}

