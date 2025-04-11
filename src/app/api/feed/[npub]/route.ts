import { NextRequest, NextResponse } from 'next/server'
import { NostrService } from '@/services/nostr/NostrService'
import { PodcastFeedGenerator } from '@/services/feed/PodcastFeedGenerator'

// Create service instances
const nostrService = new NostrService()
const feedGenerator = new PodcastFeedGenerator()

// Initialize NDK connection
let initialized = false

export async function GET(
  request: NextRequest,
  { params }: { params: { npub: string } }
) {
  try {
    // Initialize NDK if not already initialized
    if (!initialized) {
      await nostrService.initialize()
      initialized = true
      console.log('NDK initialized successfully')
    }
    
    const npub = params.npub
    const profile = await nostrService.getUserProfile(npub)
    const audioEvents = await nostrService.getAudioEvents(npub)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const feed = feedGenerator.generateFeed(profile, audioEvents)
    
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