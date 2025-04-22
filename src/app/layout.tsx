import './globals.css'
import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import { Inter } from 'next/font/google'
import Footer from '@/components/Footer'
import { getVersionInfo } from '@/utils/version'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pubcaster',
  description: 'A podcast platform for Nostr',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): ReactElement {
  const { version, commitHash } = getVersionInfo();
  
  return (
    <html lang="en" className="h-full antialiased">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            {children}
          </main>
          <Footer version={version} commitHash={commitHash} />
        </div>
      </body>
    </html>
  )
} 