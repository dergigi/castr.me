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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Profile</h1>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600">The requested profile could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-48 bg-gray-100">
            {profile.banner && (
              <Image
                src={profile.banner}
                alt="Profile banner"
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          
          <div className="p-6">
            <div className="flex items-center -mt-16 mb-6">
              <div className="relative w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
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
              <div className="ml-4">
                <h1 className="text-2xl font-bold">{profile.name || 'Anonymous'}</h1>
                {profile.about && (
                  <p className="text-gray-600 mt-1">{profile.about}</p>
                )}
              </div>
            </div>

            {/* Podcast Feed Link */}
            <div className="mb-8">
              <a
                href={`/${npub}/rss.xml`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                Subscribe to podcast feed
              </a>
            </div>

            {/* Audio Posts */}
            <div className="space-y-6">
              {audioEvents.map((event: NDKEvent) => {
                const audioUrl = event.content.match(/https?:\/\/[^\s]+\.(mp3|m4a|wav|ogg)/)?.[0]
                return (
                  <div key={event.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-800">{event.content.replace(audioUrl || '', '').trim()}</p>
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
                )
              })}
              {audioEvents.length === 0 && (
                <p className="text-gray-600 text-center py-8">No audio posts found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 