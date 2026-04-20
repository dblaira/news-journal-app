'use client'

import { useState } from 'react'
import { LivingSerifMascot } from '@/components/living-serif-mascot'

export default function MascotDemoPage() {
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4rem' }}>
      {/* Dark background version */}
      <div style={{
        background: '#000000',
        borderRadius: '24px',
        padding: '4rem 6rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}>
        <LivingSerifMascot isProcessing={isProcessing} size="xl" />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          {isProcessing ? 'Retrieving wisdom...' : 'Resting'}
        </p>
      </div>

      {/* Size variations on light bg */}
      <div style={{
        display: 'flex',
        gap: '3rem',
        alignItems: 'flex-end',
        background: '#f5f5f5',
        borderRadius: '16px',
        padding: '3rem 4rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <LivingSerifMascot isProcessing={isProcessing} size="sm" />
          <p style={{ fontSize: '0.65rem', color: '#999', marginTop: '0.5rem' }}>sm</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <LivingSerifMascot isProcessing={isProcessing} size="md" />
          <p style={{ fontSize: '0.65rem', color: '#999', marginTop: '0.5rem' }}>md</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <LivingSerifMascot isProcessing={isProcessing} size="lg" />
          <p style={{ fontSize: '0.65rem', color: '#999', marginTop: '0.5rem' }}>lg</p>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setIsProcessing(!isProcessing)}
        style={{
          padding: '0.75rem 2rem',
          borderRadius: '8px',
          border: 'none',
          background: isProcessing ? '#DC143C' : '#1a1a1a',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {isProcessing ? 'Stop Processing' : 'Start Processing'}
      </button>
    </div>
  )
}
