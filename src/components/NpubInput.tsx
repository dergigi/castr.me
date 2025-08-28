"use client"
import { useState, useCallback, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { decode } from 'nostr-tools/nip19'

interface NpubInputProps {
  placeholder?: string
  className?: string
}

export default function NpubInput({ placeholder = 'npub1...', className = '' }: NpubInputProps): React.JSX.Element {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const lastNavigatedRef = useRef<string | null>(null)
  const lastPrefetchedRef = useRef<string | null>(null)

  const decodeNpub = useCallback((text: string): boolean => {
    if (!text) return false
    try {
      const trimmed = text.trim()
      const decoded = decode(trimmed)
      return decoded.type === 'npub'
    } catch {
      return false
    }
  }, [])

  const onSubmit = useCallback((e: FormEvent): void => {
    e.preventDefault()
    const input = value.trim()
    if (decodeNpub(input)) {
      setIsNavigating(true)
      router.push(`/${input}`)
    }
  }, [value, decodeNpub, router])

  useEffect((): (() => void) | void => {
    if (!value) {
      setIsValid(false)
      return
    }
    const input = value.trim()
    const valid = decodeNpub(input)
    setIsValid(valid)
    if (valid) {
      if (lastPrefetchedRef.current !== input) {
        lastPrefetchedRef.current = input
        // Best-effort prefetch; ignore errors (Next may not prefetch on some routes)
        try { router.prefetch(`/${input}`); } catch { /* noop */ }
      }
      if (lastNavigatedRef.current !== input) {
        lastNavigatedRef.current = input
        setIsNavigating(true)
        router.push(`/${input}`)
      }
    }
  }, [value, decodeNpub, router])

  return (
    <form onSubmit={onSubmit} className={`flex w-full max-w-xl items-stretch gap-2 ${className}`}>
      <div className="relative w-full">
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e): void => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-gray-300 bg-white pl-5 pr-12 py-3 mb-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          aria-label="npub"
        />
        {isValid && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {isNavigating ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        )}
      </div>
    </form>
  )
}


