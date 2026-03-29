'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logWater, logCaffeine, logSupplementStack } from '@/app/nutrition/actions/intake'
import { ComposeModal } from './ComposeModal'
import { C } from '@/lib/nutrition/colors'

interface QuickLogButtonsProps {
  todayWaterOz: number
  todayCaffeineMg: number
}

export function QuickLogButtons({ todayWaterOz, todayCaffeineMg }: QuickLogButtonsProps) {
  const router = useRouter()
  const [waterExpanded, setWaterExpanded] = useState(false)
  const [caffeineExpanded, setCaffeineExpanded] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 2000)
  }

  const handleWater = async (oz: number) => {
    const result = await logWater(oz)
    if (result.success) {
      showFeedback(`+${oz}oz water`)
      router.refresh()
    }
    setWaterExpanded(false)
  }

  const handleCaffeine = async (source: string, mg: number) => {
    const result = await logCaffeine(source, mg)
    if (result.success) {
      showFeedback(`+${mg}mg caffeine`)
      router.refresh()
    }
    setCaffeineExpanded(false)
  }

  const handleSupplements = async (timeOfDay: string) => {
    const result = await logSupplementStack(timeOfDay)
    if (result.error) {
      showFeedback(result.error)
    } else {
      showFeedback(`${result.count} supplements logged`)
      router.refresh()
    }
  }

  return (
    <>
      {/* Feedback toast */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: C.charcoal,
          color: C.white,
          padding: '10px 24px',
          borderRadius: 20,
          fontSize: '0.85rem',
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          zIndex: 3000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {feedback}
        </div>
      )}

      {/* Quick log section */}
      <div style={{ padding: '0 20px' }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 800,
          color: C.charcoal,
          margin: '0 0 14px',
          fontFamily: "'Outfit', sans-serif",
        }}>
          Quick Log
        </h2>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Water button */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <button
              onClick={() => { setWaterExpanded(!waterExpanded); setCaffeineExpanded(false) }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 18,
                border: 'none',
                background: C.ocean,
                color: C.white,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                {Math.round(todayWaterOz)}oz
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7, marginTop: 4 }}>
                Water Today
              </div>
            </button>
            {waterExpanded && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[
                  { label: '8oz', oz: 8 },
                  { label: '16oz', oz: 16 },
                  { label: '32oz', oz: 32 },
                ].map(w => (
                  <button
                    key={w.oz}
                    onClick={() => handleWater(w.oz)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 12,
                      border: `2px solid ${C.ocean}`,
                      background: C.white,
                      color: C.ocean,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    +{w.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Caffeine button */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <button
              onClick={() => { setCaffeineExpanded(!caffeineExpanded); setWaterExpanded(false) }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 18,
                border: 'none',
                background: C.ocean,
                color: C.white,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                {Math.round(todayCaffeineMg)}mg
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7, marginTop: 4 }}>
                Caffeine Today
              </div>
            </button>
            {caffeineExpanded && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[
                  { label: 'Espresso', source: 'espresso', mg: 63 },
                  { label: 'Coffee', source: 'coffee_12oz', mg: 140 },
                  { label: 'Pre-WO', source: 'pre_workout', mg: 200 },
                ].map(c => (
                  <button
                    key={c.source}
                    onClick={() => handleCaffeine(c.source, c.mg)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 12,
                      border: `2px solid ${C.ocean}`,
                      background: C.white,
                      color: C.ocean,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                      lineHeight: 1.3,
                    }}
                  >
                    {c.label}<br />{c.mg}mg
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Supplement stack buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {[
            { label: 'Morning Stack', time: 'morning', bg: '#E8F5E9', color: '#2E7D32' },
            { label: 'Evening Stack', time: 'evening', bg: '#E8EAF6', color: '#283593' },
          ].map(s => (
            <button
              key={s.time}
              onClick={() => handleSupplements(s.time)}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 14,
                border: 'none',
                background: s.bg,
                color: s.color,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Compose button */}
        <button
          onClick={() => setComposeOpen(true)}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '14px',
            borderRadius: 14,
            border: `3px solid ${C.charcoal}`,
            background: C.white,
            color: C.charcoal,
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          + Compose Detailed Entry
        </button>
      </div>

      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
