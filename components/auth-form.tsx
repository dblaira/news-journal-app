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
    <div className="min-h-screen flex">
      {/* Left Column - Pure White Background with Iceberg Image */}
      <div className="hidden md:flex md:w-1/2 bg-white items-center justify-center p-8 lg:p-12">
        <img
          src="/iceberg_login.png"
          alt="Iceberg illustration - what you see is just the surface"
          className="w-full max-w-xl object-contain"
        />
      </div>

      {/* Right Column - Pure Black Background with Form */}
      <div className="w-full md:w-1/2 bg-black flex flex-col min-h-screen">
        {/* Personal Press Branding */}
        <header className="px-6 py-8 md:px-12 lg:px-16 text-center">
          <h1 
            className="text-xl md:text-2xl tracking-[0.2em] text-white uppercase"
            style={{ fontFamily: "'Playfair Display', 'Times New Roman', serif" }}
          >
            Personal Press
          </h1>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12 md:px-12 lg:px-16">
          <div className="w-full max-w-md">
            {/* Headline */}
            <h2 
              className="text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-10 text-center"
              style={{ fontFamily: "'Playfair Display', 'Times New Roman', serif" }}
            >
              {isSignUp ? 'Create your account' : 'Welcome back to your news journal'}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-xs uppercase tracking-wider text-white/70 font-medium"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-black border border-white/30 rounded text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors disabled:opacity-50"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="block text-xs uppercase tracking-wider text-white/70 font-medium"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-black border border-white/30 rounded text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-white hover:bg-white/90 text-black font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? isSignUp
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </form>

            {/* Toggle Auth Mode */}
            <p className="mt-8 text-center text-white/70 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-white hover:text-white/80 font-medium underline transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
