import { NextRequest, NextResponse } from 'next/server'
import { NostrService } from '@/services/nostr/NostrService'
import { PodcastFeedGenerator } from '@/services/feed/PodcastFeedGenerator'

// Create service instances
const nostrService = new NostrService()
const feedGenerator = new PodcastFeedGenerator(nostrService)

// Initialize NDK connection
let initialized = false

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ npub: string }> }
): Promise<NextResponse> {
  try {
    // Initialize NDK if not already initialized
    if (!initialized) {
      await nostrService.initialize()
      initialized = true
      console.log('NDK initialized successfully')
    }
    
    const resolvedParams = await params
    let npub = resolvedParams.npub
    
    // Decode URL encoding if present
    try {
      npub = decodeURIComponent(npub)
    } catch {
      // If not URL-encoded, use as-is
    }
    
    const profile = await nostrService.getUserProfile(npub)
    const events = await nostrService.getKind1Events(npub)
    const audioEvents = events.filter(event => nostrService.isMediaEvent(event))
    const liveActivityEvents = await nostrService.getLiveActivityEvents(npub)

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const feed = feedGenerator.generateFeed(profile, audioEvents, npub, undefined, liveActivityEvents)

    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  } catch (error) {
    console.error('Error generating feed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 