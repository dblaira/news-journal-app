'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Session check:', { data, error })
      setSession(data.session)
    })

    // Check cookies
    setCookies(document.cookie)
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Auth Debug Page</h1>
      <h2>Session:</h2>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <h2>Cookies:</h2>
      <pre>{cookies || 'No cookies found'}</pre>
      <h2>All Cookies:</h2>
      <pre>{document.cookie.split(';').join('\n')}</pre>
    </div>
  )
}

