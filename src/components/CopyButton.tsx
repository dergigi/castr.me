'use client'

import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface CopyButtonProps {
  url: string
}

export default function CopyButton({ url }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center w-8 h-8 text-gray-100 hover:text-white transition-all duration-200 rounded-full bg-gray-900/40 hover:bg-gray-900/60 backdrop-blur-sm ml-2"
      title={copied ? "Copied!" : "Copy RSS feed URL"}
    >
      {copied ? (
        <CheckIcon className="w-4 h-4 text-green-400" />
      ) : (
        <ClipboardDocumentIcon className="w-4 h-4" />
      )}
    </button>
  )
}
