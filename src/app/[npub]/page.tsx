import { NostrService } from '@/services/nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import Image from 'next/image'
import type { ReactElement } from 'react'

// Create service instance
const nostrService = new NostrService()

// Initialize NDK connection
let initialized = false

export default async function NpubPage({
  params,
}: {
  params: Promise<{ npub: string }>
}): Promise<ReactElement> {
  // Initialize NDK if not already initialized
  if (!initialized) {
    await nostrService.initialize()
    initialized = true
    console.log('NDK initialized successfully')
  }
  
  // Get the npub from params
  const resolvedParams = await params
  const npub = resolvedParams.npub
  
  if (!npub) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Invalid Profile</h1>
          <p className="text-gray-600">No profile ID provided.</p>
        </div>
      </div>
    )
  }

  const profile = await nostrService.getUserProfile(npub)
  const events = await nostrService.getKind1Events(npub)
  const audioEvents = events.filter(event => nostrService.isAudioEvent(event))
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Profile Not Found</h1>
          <p className="text-gray-600">The requested profile could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-64 bg-gray-900">
        {profile.banner && (
          <Image
            src={profile.banner}
            alt="Profile banner"
            fill
            className="object-cover opacity-80"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/60" />
      </div>
      
      <div className="max-w-3xl mx-auto px-4 -mt-32">
        {/* Profile Info */}
        <div className="relative flex flex-col items-center text-center mb-12">
          <div className="relative w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden mb-4">
            {profile.image && (
              <Image
                src={profile.image}
                alt={profile.name || 'Profile picture'}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{profile.name || 'Anonymous'}</h1>
          {profile.about && (
            <p className="text-gray-200 text-lg max-w-2xl drop-shadow-lg">{profile.about}</p>
          )}
        </div>

        {/* Podcast Feed Link */}
        <div className="mb-12 text-center">
          <a
            href={`/${npub}/rss.xml`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            RSS Feed
          </a>
        </div>

        {/* Audio Posts */}
        <div className="space-y-8">
          {audioEvents.map((event: NDKEvent) => {
            const audioUrl = event.content.match(/https?:\/\/[^\s]+\.(mp3|m4a|wav|ogg)/)?.[0]
            const cleanContent = event.content.replace(audioUrl || '', '').trim()
            return (
              <div key={event.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-900 font-medium">{cleanContent}</p>
                    <span className="text-sm text-gray-500">
                      {new Date(event.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  {audioUrl && (
                    <audio
                      controls
                      className="w-full h-10"
                      src={audioUrl}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              </div>
            )
          })}
          {audioEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No audio posts found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 