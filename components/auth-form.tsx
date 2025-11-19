'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        // Wait for session to be established
        if (data.session) {
          setSuccess('Account created! Redirecting...')
          // Ensure session is synced - browser client handles cookies automatically
          // Use full page reload to ensure middleware picks up cookies
          setTimeout(() => {
            window.location.href = '/'
          }, 500)
        } else {
          setSuccess('Account created! Please check your email to confirm your account.')
          setIsLoading(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Wait for session to be established
        if (data.session) {
          setSuccess('Signed in! Redirecting...')
          // Browser client automatically syncs session to cookies
          // Use full page reload to ensure middleware picks up cookies
          setTimeout(() => {
            window.location.href = '/'
          }, 300)
        } else {
          throw new Error('No session created. Please try again.')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)

      let errorMsg = error.message
      if (error.message?.includes('Invalid API key')) {
        errorMsg = 'Invalid Supabase API key. Please check your configuration.'
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMsg = 'Invalid email or password. Please try again.'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMsg = 'Please check your email and confirm your account before signing in.'
      } else if (error.message?.includes('Failed to fetch')) {
        errorMsg = 'Network error. Please check your connection and try again.'
      } else if (!error.message) {
        errorMsg = 'An error occurred. Please try again.'
      }

      setError(errorMsg)
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <h1 id="form-title">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
      <p className="subtitle">Welcome back to your news journal</p>

      {error && (
        <div className="error-message" style={{ display: 'block' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="success-message" style={{ display: 'block' }}>
          {success}
        </div>
      )}

      <form id="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            required
            placeholder="••••••••"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button type="submit" id="submit-btn" disabled={isLoading}>
          {isLoading
            ? isSignUp
              ? 'Creating Account...'
              : 'Signing In...'
            : isSignUp
            ? 'Create Account'
            : 'Sign In'}
        </button>
      </form>

      <div className="toggle-auth">
        <span id="toggle-text">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        </span>
        <a href="#" id="toggle-link" onClick={(e) => {
          e.preventDefault()
          toggleMode()
        }}>
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </a>
      </div>
    </div>
  )
}

