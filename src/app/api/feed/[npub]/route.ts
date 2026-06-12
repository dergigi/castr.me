import { NextRequest, NextResponse } from 'next/server'
import { NostrService } from '@/services/nostr/NostrService'
import { isValidNostrIdentifier } from '@/services/nostr/identifier'
import { PodcastFeedGenerator } from '@/services/feed/PodcastFeedGenerator'
import {
  FEED_CACHE_CONTROL,
  FEED_ERROR_CACHE_CONTROL,
  FEED_INVALID_CACHE_CONTROL,
  FEED_NOT_FOUND_CACHE_CONTROL,
} from '@/config/cache'

// Create service instances
const nostrService = new NostrService()
const feedGenerator = new PodcastFeedGenerator()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ npub: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    let npub = resolvedParams.npub

    // Decode URL encoding if present
    try {
      npub = decodeURIComponent(npub)
    } catch {
      // If not URL-encoded, use as-is
    }

    // Reject malformed identifiers before doing any relay work
    if (!isValidNostrIdentifier(npub)) {
      return NextResponse.json(
        { error: 'Invalid Nostr identifier' },
        { status: 400, headers: { 'Cache-Control': FEED_INVALID_CACHE_CONTROL } }
      )
    }

    const profile = await nostrService.getUserProfile(npub)
    const events = await nostrService.getKind1Events(npub)
    const audioEvents = events.filter(event => nostrService.isMediaEvent(event))

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404, headers: { 'Cache-Control': FEED_NOT_FOUND_CACHE_CONTROL } }
      )
    }

    const feed = feedGenerator.generateFeed(profile, audioEvents, npub)

    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': FEED_CACHE_CONTROL,
      },
    })
  } catch (error) {
    console.error('Error generating feed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': FEED_ERROR_CACHE_CONTROL } }
    )
  }
}
