"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DEMO_NPUB = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n'

export default function PrefetchDemo(): null {
  const router = useRouter()

  useEffect((): void => {
    try { router.prefetch(`/${DEMO_NPUB}`) } catch { /* noop */ }
  }, [router])

  return null
}
