'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DebugPhotoPage() {
  const router = useRouter()
  const [entryId, setEntryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    if (!entryId.trim()) {
      setError('Please enter an entry ID')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`/api/debug-photo?entryId=${encodeURIComponent(entryId)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to check photo')
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to check photo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#13c9b3', marginBottom: '1rem' }}>Photo Debug Tool</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f5f7ff' }}>
          Entry ID:
        </label>
        <input
          type="text"
          value={entryId}
          onChange={(e) => setEntryId(e.target.value)}
          placeholder="Paste entry UUID here"
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(9, 13, 24, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            color: '#f5f7ff',
            fontSize: '0.95rem',
          }}
        />
        <button
          onClick={handleCheck}
          disabled={loading}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#13c9b3',
            color: '#02151f',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Checking...' : 'Check Photo'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          background: '#121a31',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ color: '#f5f7ff', marginBottom: '1rem' }}>Results</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: '#13c9b3' }}>Entry:</strong>
            <div style={{ color: '#d0d6f1', marginTop: '0.5rem' }}>
              <div>ID: {result.entry.id}</div>
              <div>Headline: {result.entry.headline}</div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: '#13c9b3' }}>Stored Photo URL:</strong>
            <div style={{ 
              color: result.photoUrl.accessible ? '#22c55e' : '#ef4444',
              marginTop: '0.5rem',
              wordBreak: 'break-all',
            }}>
              <div>{result.photoUrl.stored || '(not set)'}</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Status: {result.photoUrl.accessible ? '✅ Accessible' : '❌ Not accessible'}
              </div>
              {result.photoUrl.error && (
                <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem' }}>
                  Error: {result.photoUrl.error}
                </div>
              )}
            </div>
          </div>

          <div>
            <strong style={{ color: '#13c9b3' }}>Expected URL Format:</strong>
            <div style={{ color: '#d0d6f1', marginTop: '0.5rem', wordBreak: 'break-all' }}>
              <div>{result.expectedUrl.url || '(could not generate)'}</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Status: {result.expectedUrl.accessible ? '✅ Accessible' : '❌ Not accessible'}
              </div>
            </div>
          </div>

          {result.photoUrl.stored && result.expectedUrl.url && result.photoUrl.stored !== result.expectedUrl.url && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '8px',
              color: '#ffc107',
            }}>
              ⚠️ Warning: Stored URL doesn't match expected format!
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a202c', borderRadius: '8px' }}>
        <h3 style={{ color: '#f5f7ff', marginBottom: '0.5rem' }}>How to find Entry ID:</h3>
        <ol style={{ color: '#d0d6f1', paddingLeft: '1.5rem' }}>
          <li>Go to Supabase Dashboard → Table Editor → entries</li>
          <li>Find your entry "Results...the New Loyalty"</li>
          <li>Copy the ID column value (UUID)</li>
          <li>Paste it above and click "Check Photo"</li>
        </ol>
      </div>
    </div>
  )
}

