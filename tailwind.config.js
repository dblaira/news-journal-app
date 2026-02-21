/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'editorial': ['var(--font-bodoni-moda)', 'Georgia', "'Times New Roman'", 'serif'],
        'body': ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      spacing: {
        'tight': '4px',
        'compact': '8px',
        'small': '12px',
        'medium': '16px',
        'comfortable': '24px',
        'roomy': '32px',
        'dramatic': '48px',
      },
      colors: {
        'understood-beige': '#E8E2D8',
        'understood-crimson': '#DC143C',
        'understood-crimson-dark': '#B01030',
        'understood-cream': '#F5F0E8',
      },
      keyframes: {
        enlightenment: {
          '0%, 100%': { color: '#000000' },
          '35%': { color: '#E8E2D8' },
          '50%': { color: '#FFFFFF', textShadow: '0 0 20px rgba(255,255,255,0.5)' },
          '65%': { color: '#E8E2D8' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(0.85)', opacity: '0.8' },
        },
      },
      animation: {
        enlightenment: 'enlightenment 3s ease-in-out infinite',
        heartbeat: 'heartbeat 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

