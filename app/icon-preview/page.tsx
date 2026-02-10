export default function IconPreview() {
  const red = '#DC143C'
  const white = '#FFFFFF'

  return (
    <div style={{ padding: '2rem', background: '#000', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ marginBottom: '0.5rem', fontFamily: 'sans-serif' }}>AI Search Icon — Two-Tone</h1>
      <p style={{ marginBottom: '2rem', fontFamily: 'sans-serif', color: '#888', fontSize: '0.85rem' }}>
        Red magnifying glass + white diamond sparkle. Elegant yet eye-catching.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem', maxWidth: '1000px' }}>

        {/* ===== V1 — 100px ===== */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '2rem', display: 'inline-block' }}>
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
              <path
                d="M 15 8 A 6.5 6.5 0 1 1 5.5 6.5"
                stroke={red} strokeWidth="2" strokeLinecap="round" fill="none"
              />
              <line x1="14" y1="16" x2="19.5" y2="21.5" stroke={red} strokeWidth="2.2" strokeLinecap="round" />
              <path
                d="M 11 1 Q 11 4.8, 15 4.8 Q 11 4.8, 11 8.6 Q 11 4.8, 7 4.8 Q 11 4.8, 11 1 Z"
                stroke={white} strokeWidth="1" strokeLinejoin="round" fill="none"
              />
            </svg>
          </div>
          <p style={{ marginTop: '0.75rem', fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#888' }}>
            V1 — 100px &middot; Thin stroke, centered
          </p>
        </div>

        {/* ===== V2 — 120px ===== */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '2rem', display: 'inline-block' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <path
                d="M 15.5 8.5 A 7 7 0 1 1 5 6"
                stroke={red} strokeWidth="2" strokeLinecap="round" fill="none"
              />
              <line x1="14.5" y1="16.5" x2="20" y2="22" stroke={red} strokeWidth="2.2" strokeLinecap="round" />
              <path
                d="M 11.5 0.5 Q 11.5 5, 16 5 Q 11.5 5, 11.5 9.5 Q 11.5 5, 7 5 Q 11.5 5, 11.5 0.5 Z"
                stroke={white} strokeWidth="1" strokeLinejoin="round" fill="none"
              />
            </svg>
          </div>
          <p style={{ marginTop: '0.75rem', fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#888' }}>
            V2 — 120px &middot; Bigger star, thin
          </p>
        </div>

        {/* ===== V3 — 90px ===== */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '2rem', display: 'inline-block' }}>
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none">
              <path
                d="M 14.5 7.5 A 6 6 0 1 1 6 6.5"
                stroke={red} strokeWidth="2" strokeLinecap="round" fill="none"
              />
              <line x1="13.5" y1="15.5" x2="19" y2="21" stroke={red} strokeWidth="2" strokeLinecap="round" />
              <path
                d="M 11 2.5 Q 11 5.2, 13.7 5.2 Q 11 5.2, 11 7.9 Q 11 5.2, 8.3 5.2 Q 11 5.2, 11 2.5 Z"
                stroke={white} strokeWidth="0.9" strokeLinejoin="round" fill="none"
              />
            </svg>
          </div>
          <p style={{ marginTop: '0.75rem', fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#888' }}>
            V3 — 90px &middot; Compact, very thin
          </p>
        </div>

        {/* ===== V4 — 110px, wider body ===== */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '2rem', display: 'inline-block' }}>
            <svg width="110" height="110" viewBox="0 0 24 24" fill="none">
              <path
                d="M 15 8 A 6.5 6.5 0 1 1 5.5 6"
                stroke={red} strokeWidth="2" strokeLinecap="round" fill="none"
              />
              <line x1="14" y1="16" x2="19.5" y2="21.5" stroke={red} strokeWidth="2.2" strokeLinecap="round" />
              <path
                d="M 11 1.2 C 11.5 3.5, 12.5 4, 15 4.8 C 12.5 5.6, 11.5 6.1, 11 8.4 C 10.5 6.1, 9.5 5.6, 7 4.8 C 9.5 4, 10.5 3.5, 11 1.2 Z"
                stroke={white} strokeWidth="1" strokeLinejoin="round" fill="none"
              />
            </svg>
          </div>
          <p style={{ marginTop: '0.75rem', fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#888' }}>
            V4 — 110px &middot; Wider body star
          </p>
        </div>

        {/* ===== V5 — 80px, hairline ===== */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '2rem', display: 'inline-block' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path
                d="M 14.5 7.5 A 6 6 0 1 1 6 6"
                stroke={red} strokeWidth="1.8" strokeLinecap="round" fill="none"
              />
              <line x1="13.5" y1="15.5" x2="18.5" y2="20.5" stroke={red} strokeWidth="1.8" strokeLinecap="round" />
              <path
                d="M 11 2 Q 11 5, 14 5 Q 11 5, 11 8 Q 11 5, 8 5 Q 11 5, 11 2 Z"
                stroke={white} strokeWidth="0.8" strokeLinejoin="round" fill="none"
              />
            </svg>
          </div>
          <p style={{ marginTop: '0.75rem', fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#888' }}>
            V5 — 80px &middot; Hairline delicate
          </p>
        </div>

        {/* ===== V6 — 140px, closest to ref ===== */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '2rem', display: 'inline-block' }}>
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none">
              <path
                d="M 15.5 8.5 A 7 7 0 1 1 5.5 5.5"
                stroke={red} strokeWidth="1.8" strokeLinecap="round" fill="none"
              />
              <line x1="14.8" y1="16.8" x2="20.5" y2="22.5" stroke={red} strokeWidth="2" strokeLinecap="round" />
              <path
                d="M 11.5 0.5 Q 11.5 4.8, 15.8 4.8 Q 11.5 4.8, 11.5 9.1 Q 11.5 4.8, 7.2 4.8 Q 11.5 4.8, 11.5 0.5 Z"
                stroke={white} strokeWidth="1.2" strokeLinejoin="round" fill="none"
              />
            </svg>
          </div>
          <p style={{ marginTop: '0.75rem', fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#888' }}>
            V6 — 140px &middot; Closest to reference
          </p>
        </div>

      </div>

      {/* Reference */}
      <h2 style={{ marginTop: '3rem', marginBottom: '1rem', fontFamily: 'sans-serif', color: '#888', fontSize: '1rem' }}>
        Reference
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-preview/A_I_Search.png" alt="Reference" width={200} height={200} style={{ borderRadius: '8px' }} />
    </div>
  )
}
