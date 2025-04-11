import './globals.css'
import type { Metadata } from 'next'
import type { ReactElement } from 'react'

export const metadata: Metadata = {
  title: 'Pubcaster - Nostr Podcast Feed Generator',
  description: 'Automatically generate podcast feeds from Nostr profiles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 