'use client'

import { useState } from 'react'

/**
 * Design Preview Sandbox
 * 
 * Paste your HTML/CSS code here to preview it.
 * This page is isolated from the main app - perfect for experimenting!
 * 
 * Instructions:
 * 1. Edit the HTML and CSS strings below
 * 2. Save the file
 * 3. View at /preview
 * 4. Iterate until you're happy with the design
 */

export default function PreviewPage() {
  const [htmlCode, setHtmlCode] = useState(`<main class="demo-shell">
  <header class="demo-header">
    <div>
      <div class="demo-title">Focus Ring Showcase · Navy &amp; Gold</div>
      <p class="demo-subtitle">
        Compare three keyboard focus treatments on a dark UI. Use
        <strong>Tab</strong> to move between controls and confirm that focus is always
        visible, strong, and non-distracting.
      </p>
    </div>
    <div class="badge">
      <span class="badge-dot"></span>
      <span>Keyboard First</span>
    </div>
  </header>

  <section class="grid" aria-label="Focus ring patterns">
    <!-- Card 1: Minimal Outline -->
    <article class="card">
      <h2>1 · Minimal Outline</h2>
      <p>
        A clean, high-contrast gold outline. Zero blur, very low visual noise,
        and fully WCAG-compliant.
      </p>
      <div class="control-row">
        <button class="focus-outline primary">Primary action</button>
        <a href="#" class="ghost-link focus-outline">Text-style link</a>
      </div>
      <div class="card-footer-note">
        Use where the surrounding UI is simple and you want the focus ring to feel native.
      </div>
    </article>

    <!-- Card 2: Layered Ring -->
    <article class="card">
      <h2>2 · Layered Ring + Halo</h2>
      <p>
        Crisp inner ring with a soft outer halo. Stands out on busy or textured
        surfaces without feeling like a glow stick.
      </p>
      <div class="control-row">
        <button class="focus-ring primary">Call to action</button>
        <button class="focus-ring">Secondary</button>
        <a href="#" class="ghost-link focus-ring">Subtle link</a>
      </div>
      <div class="card-footer-note">
        Great default for most interactive elements in a dark, cinematic UI.
      </div>
    </article>

    <!-- Card 3: Inset Glow -->
    <article class="card">
      <h2>3 · Inset Input Glow</h2>
      <p>
        Focus appears as a gold inset border with a subtle outer ring. Designed
        specifically for inputs and text fields.
      </p>
      <div class="control-row">
        <input
          class="focus-inset"
          type="text"
          placeholder="Email address"
        />
        <input
          class="focus-inset"
          type="text"
          placeholder="Username"
        />
      </div>
      <div class="card-footer-note">
        Works well when fields already have visible borders and you want a "lit from within" feel.
      </div>
    </article>
  </section>

  <section class="hint">
    <span><strong>Try it:</strong> Press <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> to move focus.</span>
    <span>The ring should always be obvious from ~2+ feet away on your display.</span>
  </section>
</main>
`)

  const [cssCode, setCssCode] = useState(`:root {
  --bg: #0b1220;                /* navy */
  --bg-soft: #111827;
  --fg: #e7e9f1;                /* light text */
  --muted: #9ca3af;
  --ring: #d4af37;              /* gold */
  --ring-outer: rgba(212, 175, 55, 0.35);
  --ring-inner: rgba(212, 175, 55, 0.85);
  --focus-thickness: 3px;       /* meets WCAG "visible" intent */
  --focus-radius: 8px;
  --focus-shadow-spread: 4px;
  --focus-duration: 120ms;
  --border-subtle: rgba(231, 233, 241, 0.25);
  --accent: #facc15;
  --card-radius: 16px;
}

* {
  box-sizing: border-box;
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    "SF Pro Text", "Segoe UI", sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #111827, #020617 60%);
  color: var(--fg);
}

.demo-shell {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 24px;
  padding: 32px 28px;
  max-width: 880px;
  width: 100%;
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(148, 163, 184, 0.2);
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(26px);
}

header.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.demo-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.demo-subtitle {
  font-size: 13px;
  color: var(--muted);
  max-width: 440px;
  line-height: 1.4;
}

.badge {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.3);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  background: radial-gradient(circle at top left,
    rgba(250, 204, 21, 0.14),
    rgba(0, 0, 0, 0.4));
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(250, 204, 21, 0.9);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.card {
  background: linear-gradient(
    145deg,
    rgba(15, 23, 42, 0.8),
    rgba(15, 23, 42, 0.96)
  );
  border-radius: var(--card-radius);
  padding: 18px 18px 20px;
  border: 1px solid rgba(31, 41, 55, 0.9);
  box-shadow:
    0 14px 30px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(15, 23, 42, 0.8);
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.card h2 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(248, 250, 252, 0.9);
  margin: 0 0 2px;
}

.card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--muted);
}

.card-footer-note {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
  font-style: italic;
}

.control-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button,
input,
a {
  font: inherit;
}

button,
.ghost-link {
  cursor: pointer;
}

button,
input,
.ghost-link {
  border-radius: var(--focus-radius);
  border: 1px solid var(--border-subtle);
  background: rgba(15, 23, 42, 0.7);
  color: var(--fg);
  padding: 7px 12px;
  font-size: 13px;
  line-height: 1.2;
}

input {
  min-width: 140px;
}

.ghost-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

button.primary {
  background: radial-gradient(circle at top left,
    rgba(212, 175, 55, 0.16),
    rgba(15, 23, 42, 0.98));
  border-color: rgba(212, 175, 55, 0.7);
}

/* Remove default outline; rely on :focus-visible below */
:focus {
  outline: none;
}
:focus:not(:focus-visible) {
  outline: none;
}

/* ========= 1) Minimal Outline ========== */

.focus-outline:focus-visible {
  outline: var(--focus-thickness) solid var(--ring);
  outline-offset: 2px;
}

/* ========= 2) Layered Ring (ring + halo) ========== */

.focus-ring {
  transition: box-shadow var(--focus-duration) ease,
              transform var(--focus-duration) ease;
}

.focus-ring:focus-visible {
  box-shadow:
    0 0 0 calc(var(--focus-thickness) + 1px) var(--ring-inner),
    0 0 0 calc(var(--focus-thickness) + var(--focus-shadow-spread)) var(--ring-outer);
  transform: translateY(-0.5px);
}

/* ========= 3) Inset Glow (inputs) ========== */

.focus-inset {
  transition:
    box-shadow var(--focus-duration) ease,
    border-color var(--focus-duration) ease,
    background-color var(--focus-duration) ease;
}

.focus-inset:focus-visible {
  border-color: var(--ring);
  background-color: rgba(15, 23, 42, 0.95);
  box-shadow:
    inset 0 0 0 var(--focus-thickness) var(--ring-inner),
    0 0 0 var(--focus-shadow-spread) var(--ring-outer);
}

/* Small helper text at bottom */
.hint {
  margin-top: 18px;
  font-size: 11px;
  color: var(--muted);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.hint kbd {
  font-size: 11px;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}
`)

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at top, #111827, #020617 60%)', color: '#e7e9f1' }}>
      <div className="container mx-auto p-4">
        <div className="mb-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <h2 className="text-xl font-bold mb-2 text-white">Design Preview Sandbox</h2>
          <p className="text-sm text-gray-300">
            Edit the code in the text areas below, or edit <code className="bg-black/30 px-1 rounded">app/preview/page.tsx</code> directly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* HTML Editor */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-white/20">
            <label className="block text-sm font-semibold mb-2 text-white">HTML</label>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="w-full h-96 p-2 border border-white/20 rounded bg-black/30 text-white font-mono text-sm"
              placeholder="Paste your HTML here..."
            />
          </div>

          {/* CSS Editor */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-white/20">
            <label className="block text-sm font-semibold mb-2 text-white">CSS</label>
            <textarea
              value={cssCode}
              onChange={(e) => setCssCode(e.target.value)}
              className="w-full h-96 p-2 border border-white/20 rounded bg-black/30 text-white font-mono text-sm"
              placeholder="Paste your CSS here..."
            />
          </div>
        </div>

        {/* Preview Output */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-white/20">
          <h3 className="text-lg font-semibold mb-4 text-white">Preview</h3>
          <div className="border border-white/20 rounded p-4" style={{ background: 'radial-gradient(circle at top, #111827, #020617 60%)', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style dangerouslySetInnerHTML={{ __html: cssCode }} />
            <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-blue-200 mb-2">💡 Tips:</h4>
          <ul className="text-sm text-blue-100 space-y-1 list-disc list-inside">
            <li>You can edit the code directly in the text areas above</li>
            <li>Changes update in real-time</li>
            <li>This page is isolated - won't affect your main app</li>
            <li>When you're happy with the design, copy the code and we'll integrate it</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
