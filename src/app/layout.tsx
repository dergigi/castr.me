import './globals.css'
import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import { Inter } from 'next/font/google'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'castr.me - Transform Nostr feeds into beautiful podcast feeds',
  description: 'Transform Nostr feeds into beautiful podcast feeds. Listen to your favorite Nostr content on any podcast app with castr.me. Generate RSS feeds from any Nostr npub.',
  keywords: ['nostr', 'podcast', 'rss', 'feed', 'decentralized', 'audio', 'content'],
  authors: [{ name: 'castr.me' }],
  creator: 'castr.me',
  publisher: 'castr.me',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://castr.me'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'castr.me',
    title: 'castr.me - Transform Nostr feeds into beautiful podcast feeds',
    description: 'Transform Nostr feeds into beautiful podcast feeds. Listen to your favorite Nostr content on any podcast app with castr.me.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'castr.me - Transform Nostr feeds into beautiful podcast feeds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'castr.me - Transform Nostr feeds into beautiful podcast feeds',
    description: 'Transform Nostr feeds into beautiful podcast feeds. Listen to your favorite Nostr content on any podcast app with castr.me.',
    images: ['/og-image.png'],
    creator: '@castr_me',
    site: '@castr_me',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'theme-color': '#6366f1',
    'msapplication-TileColor': '#6366f1',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): ReactElement {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 