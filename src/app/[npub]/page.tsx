import { NostrService } from '@/services/nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'

// Create service instance
const nostrService = new NostrService()

// Initialize NDK connection
let initialized = false

export default async function NpubPage({
  params,
}: {
  params: { npub: string }
}) {
  // Initialize NDK if not already initialized
  if (!initialized) {
    await nostrService.initialize()
    initialized = true
    console.log('NDK initialized successfully')
  }
  
  // Ensure params is properly typed and awaited
  const npub = params?.npub
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
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4">{profile.name || 'Anonymous'}</h1>
          {profile.about && (
            <p className="text-gray-600 mb-6">{profile.about}</p>
          )}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Podcast Feed</h2>
              <p className="text-gray-600 mb-2">
                Subscribe to this profile's podcast feed using the link below:
              </p>
              <a
                href={`/${npub}/rss.xml`}
                className="text-blue-600 hover:text-blue-800 break-all"
              >
                {`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${npub}/rss.xml`}
              </a>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Latest Audio Posts</h2>
              <div className="space-y-4">
                {audioEvents.map((event: NDKEvent) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{event.content}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      {new Date(event.created_at * 1000).toLocaleString()}
                    </div>
                  </div>
                ))}
                {audioEvents.length === 0 && (
                  <p className="text-gray-600">No audio posts found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 