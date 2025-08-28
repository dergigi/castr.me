"use client"
import { useState, useCallback, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface NpubInputProps {
  placeholder?: string
  buttonLabel?: string
  className?: string
}

export default function NpubInput({ placeholder = 'Enter your npub', buttonLabel = 'Open Feed', className = '' }: NpubInputProps): React.JSX.Element {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isLikelyNpub = useCallback((text: string): boolean => {
    // Basic check: bech32 npub starts with "npub1" and is ~63-65+ chars
    if (!text) return false
    const trimmed = text.trim()
    if (!trimmed.startsWith('npub1')) return false
    return trimmed.length >= 60 && trimmed.length <= 120
  }, [])

  const onSubmit = useCallback((e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const input = value.trim()
    if (!isLikelyNpub(input)) {
      setError('Please enter a valid npub (bech32 starting with npub1).')
      return
    }
    router.push(`/${input}`)
  }, [value, isLikelyNpub, router])

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
      <button
        type="submit"
        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        disabled={!isLikelyNpub(value)}
      >
        {buttonLabel}
      </button>
      {error && (
        <div className="w-full text-center text-xs text-red-600 mt-2">{error}</div>
      )}
    </form>
  )
}


