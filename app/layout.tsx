import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Libre_Baskerville, Lora, Source_Serif_4, Crimson_Pro, Bodoni_Moda } from 'next/font/google'
import { PushNotificationProvider } from '@/components/push-notification-provider'
import { PushPermissionPrompt } from '@/components/push-permission-prompt'
import { IosInstallPrompt } from '@/components/ios-install-prompt'
import { DebugOverlay } from '@/components/debug-overlay'
import './globals.css'

// PRIMARY — Functional voice: body text, UI, metadata (Level 4)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// PRIMARY — Editorial voice: all headlines, Level 1–3
const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni-moda',
})

// RESERVED — Available but not used in default patterns.
// Do not use these unless Adam specifically requests a font change.
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-playfair',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-crimson-pro',
})

export const metadata: Metadata = {
  title: 'Understood.',
  description: 'Your story, your way.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${libreBaskerville.variable} ${lora.variable} ${sourceSerif.variable} ${crimsonPro.variable} ${bodoniModa.variable}`}>
        <PushNotificationProvider>
          {children}
          <PushPermissionPrompt />
          <IosInstallPrompt />
        </PushNotificationProvider>
        <DebugOverlay />
      </body>
    </html>
  )
}
