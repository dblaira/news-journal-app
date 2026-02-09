'use client'

import { useState } from 'react'
import { CopyButton } from '@/components/ui/copy-button'

const DEMO_LINK = 'https://understood.app/shared/entry/abc-123-def'
const DEMO_API_KEY = 'demo_key_8f3a92c1d7e04b6f9a1b2c3d4e5f'
const DEMO_LOG_ID = 'log_2026-02-09T14:32:07Z_x7k9m2'

export default function CopyDemoPage() {
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="mx-auto max-w-xl space-y-12">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">
            Copy to Clipboard
          </h1>
          <p className="text-sm text-neutral-500">
            Component demos for the CopyButton.
          </p>
        </div>

        {/* ── Scenario A: Share Link ── */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Scenario A — Share Link
          </h2>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={DEMO_LINK}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-12 text-sm text-neutral-700 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
            />
            <CopyButton
              value={DEMO_LINK}
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
            />
          </div>
        </section>

        {/* ── Scenario B: Masked API Key ── */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Scenario B — API Key
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-mono text-neutral-700 truncate">
              {showKey
                ? DEMO_API_KEY
                : `${DEMO_API_KEY.slice(0, 7)}${'•'.repeat(24)}`}
            </div>
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              {showKey ? 'Hide' : 'Reveal'}
            </button>
            <CopyButton
              value={DEMO_API_KEY}
              label="Copy API key"
              className="shrink-0"
            />
          </div>
        </section>

        {/* ── Scenario C: Log ID row ── */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Scenario C — Log ID
          </h2>
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-2.5">
            <span className="font-mono text-sm text-neutral-700">
              {DEMO_LOG_ID}
            </span>
            <CopyButton
              value={DEMO_LOG_ID}
              iconSize={14}
              label="Copy log ID"
              className="h-7 w-7"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
