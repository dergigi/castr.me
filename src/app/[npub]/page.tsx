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
  const mediaEvents = events.filter(event => nostrService.isMediaEvent(event))
  
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
      <div className="relative h-72 bg-gray-900">
        {profile.banner && (
          <Image
            src={profile.banner}
            alt="Profile banner"
            fill
            className="object-cover opacity-90"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/10 via-gray-900/50 to-gray-900/80" />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40">
        {/* Profile Info */}
        <div className="relative flex flex-col items-center text-center mb-16">
          <a href={`${process.env.HTTP_NOSTR_GATEWAY}/${npub}`} className="relative w-40 h-40 rounded-full ring-4 ring-white bg-white shadow-xl overflow-hidden mb-6">
            {profile.image && (
              <Image
                src={profile.image}
                alt={profile.name || npub}
                fill
                className="object-cover"
                priority
              />
            )}
          </a>
          <h1 className="text-4xl font-bold text-gray-800 mb-4 tracking-tight">{profile.name || npub}</h1>
          {profile.about && (
            <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">{profile.about}</p>
          )}
        </div>

        {/* Podcast Feed Link */}
        <div className="mb-16 text-center">
          <a
            href={`/${npub}/rss.xml`}
            className="inline-flex items-center px-4 py-2 text-sm text-gray-100 hover:text-white transition-colors rounded-full bg-gray-900/40 hover:bg-gray-900/60 backdrop-blur-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            Subscribe to RSS Feed
          </a>
        </div>

        {/* Media Posts */}
        <div className="space-y-6">
          {mediaEvents.map((event: NDKEvent) => {
            const audioUrl = event.content.match(/https?:\/\/[^\s]+\.(mp3|m4a|wav|ogg)/)?.[0]
            const videoUrl = event.content.match(/https?:\/\/[^\s]+\.(mp4|webm|mov)/)?.[0]
            const cleanContent = event.content.replace(audioUrl || videoUrl || '', '').trim()
            const [headline, ...rest] = cleanContent.split('\n')
            const bodyContent = rest.join('\n').trim()
            
            return (
              <div key={event.id} className="bg-white rounded-xl shadow-sm overflow-hidden transition hover:shadow-md">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 leading-tight mb-2">{headline}</h2>
                      {bodyContent && (
                        <p className="text-gray-600 whitespace-pre-line">{bodyContent}</p>
                      )}
                    </div>
                    <a 
                      href={`${process.env.HTTP_NOSTR_GATEWAY}/${event.id}`}
                      className="text-sm text-gray-500 whitespace-nowrap hover:text-gray-700 hover:underline"
                    >
                      {new Date(event.created_at * 1000).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </a>
                  </div>
                  {audioUrl && (
                    <div className="mt-4">
                      <audio
                        controls
                        className="w-full h-12 [&::-webkit-media-controls-panel]:bg-gray-50"
                        src={audioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  {videoUrl && (
                    <div className="mt-4">
                      <video
                        controls
                        className="w-full rounded-lg"
                        src={videoUrl}
                      >
                        Your browser does not support the video element.
                      </video>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {mediaEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">No media posts found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 