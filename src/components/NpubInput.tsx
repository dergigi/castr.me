"use client"
import { useState, useCallback, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { decode } from 'nostr-tools/nip19'

interface NpubInputProps {
  placeholder?: string
  className?: string
}

export default function NpubInput({ placeholder = 'Enter your npub', className = '' }: NpubInputProps): React.JSX.Element {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
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
    setError(null)
    const input = value.trim()
    if (!decodeNpub(input)) {
      setError('Please enter a valid npub (bech32 starting with npub1).')
      return
    }
    router.push(`/${input}`)
  }, [value, decodeNpub, router])

  useEffect(() => {
    if (!value) {
      setError(null)
      return
    }
    const handle = setTimeout(() => {
      const input = value.trim()
      const isValid = decodeNpub(input)
      if (isValid) {
        if (lastNavigatedRef.current !== input) {
          lastNavigatedRef.current = input
          router.push(`/${input}`)
        }
      } else {
        setError('Invalid npub')
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [value, decodeNpub, router])

  return (
    <form onSubmit={onSubmit} className={`flex w-full max-w-xl items-stretch gap-2 ${className}`}>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        aria-label="npub"
      />
      {error && (
        <div className="w-full text-center text-xs text-red-600 mt-2">{error}</div>
      )}
    </form>
  )
}


