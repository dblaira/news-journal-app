'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DebugAuthPage() {
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('Session check:', { sessionData, sessionError })
      setSession(sessionData.session)
      
      // Check user
      const { data: userData, error: userError } = await supabase.auth.getUser()
      console.log('User check:', { userData, userError })
      setUser(userData.user)

      // Check cookies
      setCookies(document.cookie)
      setLoading(false)
    }

    checkAuth()

    // Refresh every 2 seconds
    const interval = setInterval(checkAuth, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 Auth Debug Page</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>✅ Current Session Status:</h2>
        {session ? (
          <div style={{ color: 'green' }}>
            <strong>✓ Session EXISTS</strong>
            <p>User ID: {session.user?.id}</p>
            <p>Email: {session.user?.email}</p>
            <p>Expires: {new Date(session.expires_at * 1000).toLocaleString()}</p>
          </div>
        ) : (
          <div style={{ color: 'red' }}>
            <strong>✗ No Session Found</strong>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>👤 User Status:</h2>
        {user ? (
          <div style={{ color: 'green' }}>
            <strong>✓ User Authenticated</strong>
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
          </div>
        ) : (
          <div style={{ color: 'red' }}>
            <strong>✗ No User Found</strong>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>🍪 Cookies ({document.cookie.split(';').filter(c => c.trim()).length} found):</h2>
        {cookies ? (
          <div>
            {document.cookie.split(';').map((cookie, i) => (
              <div key={i} style={{ marginBottom: '0.5rem' }}>
                <code>{cookie.trim()}</code>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'red' }}>No cookies found</div>
        )}
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>📋 Full Session Data:</h2>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ padding: '0.5rem 1rem', marginRight: '1rem', cursor: 'pointer' }}
        >
          Go to Home Page
        </button>
        <button 
          onClick={() => router.push('/login')}
          style={{ padding: '0.5rem 1rem', marginRight: '1rem', cursor: 'pointer' }}
        >
          Go to Login Page
        </button>
        <button 
          onClick={async () => {
            await supabase.auth.signOut()
            router.refresh()
          }}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

