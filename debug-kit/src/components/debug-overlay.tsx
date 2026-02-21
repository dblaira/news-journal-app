'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Bug, X, RefreshCw, CheckCircle, Trash2, Check, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  PAGE_LABELS,
  HIDDEN_PATHS,
  DEBUG_ENABLED,
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_PLACEHOLDERS,
  CATEGORY_PROMPTS,
} from '@/lib/debug/debug-config'
import type { FeedbackCategory } from '@/lib/debug/debug-config'
import type { LogLevel } from '@/lib/debug/debug-logger'

interface ErrorLog {
  id: string
  created_at: string
  level: LogLevel
  page: string
  message: string
  metadata: Record<string, unknown>
}

interface FeedbackItem {
  id: string
  created_at: string
  category: FeedbackCategory
  message: string
  page: string
  metadata: Record<string, unknown>
  resolved: boolean
}

type TabId = 'errors' | 'feedback'

function isHidden(path: string): boolean {
  return HIDDEN_PATHS.some(hp => path === hp || path.startsWith(hp + '/'))
}

function labelFor(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path]
  for (const [pattern, label] of Object.entries(PAGE_LABELS)) {
    if (!pattern.includes('[')) continue
    const regex = new RegExp('^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$')
    if (regex.test(path)) return label
  }
  return path
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DebugOverlay() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('feedback')
  const tapTimestamps = useRef<number[]>([])

  // Errors state
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [errorsLoading, setErrorsLoading] = useState(false)

  // Feedback state
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>('observation')
  const [feedbackBody, setFeedbackBody] = useState('')
  const [feedbackPage, setFeedbackPage] = useState(pathname)
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)

  // Keep feedbackPage in sync when navigating
  useEffect(() => {
    setFeedbackPage(pathname)
  }, [pathname])

  // Keyboard shortcut
  useEffect(() => {
    if (!DEBUG_ENABLED) return
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
        e.preventDefault()
        setVisible(v => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Triple-tap for mobile
  useEffect(() => {
    if (!DEBUG_ENABLED) return
    function handleTouch() {
      const now = Date.now()
      tapTimestamps.current.push(now)
      tapTimestamps.current = tapTimestamps.current.filter(t => now - t < 800)
      if (tapTimestamps.current.length >= 3) {
        tapTimestamps.current = []
        setVisible(v => !v)
      }
    }
    window.addEventListener('touchstart', handleTouch, { passive: true })
    return () => window.removeEventListener('touchstart', handleTouch)
  }, [])

  const fetchErrors = useCallback(async () => {
    setErrorsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('level', 'error')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error) setErrors((data as ErrorLog[]) ?? [])
    } catch (err) {
      console.error('[DebugOverlay] fetchErrors:', err)
    } finally {
      setErrorsLoading(false)
    }
  }, [])

  const fetchFeedback = useCallback(async () => {
    setFeedbackLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('debug_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error) setFeedbackItems((data as FeedbackItem[]) ?? [])
    } catch (err) {
      console.error('[DebugOverlay] fetchFeedback:', err)
    } finally {
      setFeedbackLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    if (activeTab === 'errors') fetchErrors()
    if (activeTab === 'feedback') fetchFeedback()
  }, [visible, activeTab, fetchErrors, fetchFeedback])

  const submitFeedback = async () => {
    if (!feedbackBody.trim() || submitting) return
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('debug_feedback')
        .insert({
          user_id: user.id,
          category: selectedCategory,
          message: feedbackBody.trim(),
          page: feedbackPage,
          metadata: {
            submitted_at: new Date().toISOString(),
            submitted_from: pathname,
          },
        })

      if (error) {
        console.error('[DebugOverlay] submit error:', error.message)
        return
      }

      setFeedbackBody('')
      setSelectedCategory('observation')
      setFeedbackPage(pathname)
      setJustSubmitted(true)
      setTimeout(() => setJustSubmitted(false), 2000)
      fetchFeedback()
    } catch (err) {
      console.error('[DebugOverlay] submit failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const resolveFeedback = async (id: string, resolved: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('debug_feedback')
        .update({ resolved })
        .eq('id', id)
        .eq('user_id', user.id)

      setFeedbackItems(prev => prev.map(f => f.id === id ? { ...f, resolved } : f))
    } catch (err) {
      console.error('[DebugOverlay] resolve failed:', err)
    }
  }

  const deleteFeedback = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('debug_feedback')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      setFeedbackItems(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      console.error('[DebugOverlay] delete failed:', err)
    }
  }

  const clearErrors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('debug_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('level', 'error')

      setErrors([])
    } catch (err) {
      console.error('[DebugOverlay] clearErrors:', err)
    }
  }

  const cancelFeedback = () => {
    setFeedbackBody('')
    setSelectedCategory('observation')
  }

  if (!DEBUG_ENABLED) return null
  if (isHidden(pathname)) return null

  const allPages = Object.entries(PAGE_LABELS) as [string, string][]

  return (
    <>
      {/* Floating bug icon */}
      {!visible && (
        <button
          onClick={() => setVisible(true)}
          aria-label="Open debug overlay"
          style={{
            position: 'fixed',
            top: 'calc(12px + env(safe-area-inset-top, 0px))',
            right: 'calc(12px + env(safe-area-inset-right, 0px))',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#22C55E',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99998,
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(34,197,94,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.25)'
          }}
        >
          <Bug size={18} color="white" />
        </button>
      )}

      {/* Full-screen overlay */}
      {visible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#F5F0E8',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 12px',
            flexShrink: 0,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-bodoni-moda), Georgia, serif',
              fontSize: '2rem',
              fontWeight: 400,
              margin: 0,
              color: '#1A1A1A',
            }}>
              Debug
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => activeTab === 'errors' ? fetchErrors() : fetchFeedback()}
                aria-label="Refresh"
                style={iconBtnStyle}
              >
                <RefreshCw size={16} color="#666" />
              </button>
              {activeTab === 'errors' && errors.length > 0 && (
                <button
                  onClick={clearErrors}
                  aria-label="Clear all errors"
                  style={iconBtnStyle}
                >
                  <Trash2 size={16} color="#666" />
                </button>
              )}
              <button
                onClick={() => setVisible(false)}
                aria-label="Close debug panel"
                style={iconBtnStyle}
              >
                <X size={18} color="#666" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: '0 20px',
            flexShrink: 0,
          }}>
            {(['errors', 'feedback'] as TabId[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #DC143C' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  color: activeTab === tab ? '#1A1A1A' : '#999',
                  transition: 'color 200ms, border-color 200ms',
                }}
              >
                {tab === 'errors' ? 'Errors' : 'Feedback'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {activeTab === 'errors' && (
              <ErrorsPanel
                errors={errors}
                isLoading={errorsLoading}
              />
            )}
            {activeTab === 'feedback' && (
              <FeedbackPanel
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                body={feedbackBody}
                onChangeBody={setFeedbackBody}
                page={feedbackPage}
                onChangePage={setFeedbackPage}
                allPages={allPages}
                currentPath={pathname}
                onSubmit={submitFeedback}
                onCancel={cancelFeedback}
                submitting={submitting}
                justSubmitted={justSubmitted}
                items={feedbackItems}
                isLoading={feedbackLoading}
                onResolve={resolveFeedback}
                onDelete={deleteFeedback}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================
// Errors Tab
// ============================================================

function ErrorsPanel({ errors, isLoading }: {
  errors: ErrorLog[]
  isLoading: boolean
}) {
  if (isLoading) {
    return <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>Loading...</div>
  }

  if (errors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <CheckCircle size={28} color="#22C55E" />
        </div>
        <div style={{ color: '#999', fontSize: '0.95rem' }}>No errors logged</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {errors.map(err => (
        <div key={err.id} style={{
          background: '#FFF',
          borderRadius: '8px',
          padding: '12px 16px',
          borderLeft: '3px solid #EF4444',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08rem' }}>
              ERROR
            </span>
            <span style={{ fontSize: '0.75rem', color: '#999' }}>
              {timeAgo(err.created_at)}
            </span>
          </div>
          <div style={{ fontSize: '0.95rem', color: '#1A1A1A', lineHeight: 1.4 }}>
            {err.message}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
            {labelFor(err.page)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Feedback Tab
// ============================================================

function FeedbackPanel({
  selectedCategory,
  onSelectCategory,
  body,
  onChangeBody,
  page,
  onChangePage,
  allPages,
  currentPath,
  onSubmit,
  onCancel,
  submitting,
  justSubmitted,
  items,
  isLoading,
  onResolve,
  onDelete,
}: {
  selectedCategory: FeedbackCategory
  onSelectCategory: (c: FeedbackCategory) => void
  body: string
  onChangeBody: (s: string) => void
  page: string
  onChangePage: (s: string) => void
  allPages: [string, string][]
  currentPath: string
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  justSubmitted: boolean
  items: FeedbackItem[]
  isLoading: boolean
  onResolve: (id: string, resolved: boolean) => void
  onDelete: (id: string) => void
}) {
  const [pagePickerOpen, setPagePickerOpen] = useState(false)
  const isOverridden = page !== currentPath

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Submitted flash */}
      {justSubmitted && (
        <div style={{
          background: 'rgba(34,197,94,0.12)',
          color: '#16A34A',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 600,
          textAlign: 'center',
          fontFamily: 'inherit',
        }}>
          Submitted!
        </div>
      )}

      {/* Feedback form card */}
      <div style={{
        background: '#FFF',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        {/* Category chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: selectedCategory === cat ? '1.5px solid #DC143C' : '1.5px solid rgba(0,0,0,0.12)',
                background: selectedCategory === cat ? 'rgba(220,20,60,0.06)' : 'transparent',
                color: selectedCategory === cat ? '#DC143C' : '#666',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 200ms ease-out',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Category description */}
        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
          {CATEGORY_DESCRIPTIONS[selectedCategory]}
        </div>

        {/* Prompt chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {CATEGORY_PROMPTS[selectedCategory].map(prompt => (
            <button
              key={prompt}
              onClick={() => onChangeBody(prompt + ' ')}
              style={{
                padding: '4px 10px',
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#F5F5F5',
                color: '#666',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 200ms',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={body}
          onChange={e => onChangeBody(e.target.value)}
          placeholder={CATEGORY_PLACEHOLDERS[selectedCategory]}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.12)',
            background: '#FFF',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            color: '#1A1A1A',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#DC143C' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' }}
        />

        {/* Page picker — tappable label + expandable pill grid */}
        <div style={{ marginTop: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setPagePickerOpen(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: isOverridden ? '#2563EB' : '#1A1A1A',
              transition: 'color 200ms',
            }}
          >
            {labelFor(page)}
            {pagePickerOpen
              ? <ChevronUp size={16} color={isOverridden ? '#2563EB' : '#666'} />
              : <ChevronDown size={16} color={isOverridden ? '#2563EB' : '#666'} />
            }
          </button>

          {pagePickerOpen && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {allPages.map(([path, label]) => (
                <button
                  key={path}
                  onClick={() => {
                    onChangePage(path)
                    setPagePickerOpen(false)
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '16px',
                    border: page === path ? '1.5px solid #2563EB' : '1.5px solid rgba(0,0,0,0.1)',
                    background: page === path ? 'rgba(37,99,235,0.06)' : 'transparent',
                    color: page === path ? '#2563EB' : '#666',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 150ms ease-out',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#FFF',
              color: '#666',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!body.trim() || submitting}
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: body.trim() ? '#DC143C' : 'rgba(220,20,60,0.35)',
              color: '#FFF',
              fontSize: '1.05rem',
              fontWeight: 600,
              fontFamily: 'var(--font-bodoni-moda), Georgia, serif',
              cursor: body.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 200ms',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Previous feedback */}
      {isLoading && (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>Loading...</div>
      )}
      {!isLoading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: '#FFF',
              borderRadius: '8px',
              padding: '14px 16px',
              border: '1px solid rgba(0,0,0,0.06)',
              opacity: item.resolved ? 0.5 : 1,
              transition: 'opacity 200ms',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#DC143C',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(220,20,60,0.08)',
                  }}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>
                    {timeAgo(item.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => onResolve(item.id, !item.resolved)}
                    aria-label="Mark resolved"
                    style={{
                      ...iconBtnSmallStyle,
                      background: item.resolved ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                    }}
                  >
                    <Check size={14} color="#22C55E" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    aria-label="Delete"
                    style={{
                      ...iconBtnSmallStyle,
                      background: 'rgba(239,68,68,0.08)',
                    }}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
              <div style={{
                fontSize: '0.95rem',
                color: '#1A1A1A',
                lineHeight: 1.5,
                textDecoration: item.resolved ? 'line-through' : 'none',
              }}>
                {item.message}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                {labelFor(item.page)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Shared styles
// ============================================================

const iconBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(0,0,0,0.05)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 200ms',
}

const iconBtnSmallStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 200ms',
}
