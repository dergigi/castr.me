"use client"
import { useState, useCallback, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { decode } from 'nostr-tools/nip19'

interface NpubInputProps {
  placeholder?: string
  className?: string
}

export default function NpubInput({ placeholder = 'Paste any npub to give it a try!', className = '' }: NpubInputProps): React.JSX.Element {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const lastNavigatedRef = useRef<string | null>(null)

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

  const onSubmit = useCallback((e: FormEvent) => {
    e.preventDefault()
    const input = value.trim()
    if (decodeNpub(input)) {
      setIsNavigating(true)
      router.push(`/${input}`)
    }
  }, [value, decodeNpub, router])

  useEffect(() => {
    if (!value) return
    const handle = setTimeout(() => {
      const input = value.trim()
      const isValid = decodeNpub(input)
      setIsValid(isValid)
      if (isValid) {
        if (lastNavigatedRef.current !== input) {
          lastNavigatedRef.current = input
          setIsNavigating(true)
          router.push(`/${input}`)
        }
      }
    }, 400)
    return () => clearTimeout(handle)
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
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-gray-300 bg-white pl-4 pr-9 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          aria-label="npub"
        />
        {isValid && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
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


