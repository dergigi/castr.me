'use client'

import React, { useRef, useEffect } from 'react'
import { LiveActivity } from '@/types'
import { ClockIcon } from '@heroicons/react/24/outline'
import { CalendarIcon } from '@heroicons/react/24/solid'
import { getMediaCategory, isHLSStream } from '@/utils/mimeTypes'

// Utility function to detect media type from URL
const getMediaType = (url: string): 'audio' | 'video' | 'unknown' => {
  return getMediaCategory(url)
}

// HLS Video Player Component
const HLSPlayer = ({ src, className, autoPlay = false }: { src: string; className?: string; autoPlay?: boolean }): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: unknown = null

    const setupVideo = async (): Promise<void> => {
      if (isHLSStream(src)) {
        // For HLS streams, we'll try to load HLS.js dynamically
        try {
          // Try to load HLS.js from CDN
          const Hls = (window as unknown as { Hls?: unknown }).Hls || await loadHLSLibrary()

          if (Hls.isSupported()) {
            hls = new Hls()
            hls.loadSource(src)
            hls.attachMedia(video)

            // Start playing when ready
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (autoPlay) {
                video.play().catch(e => {
                  console.log('Autoplay prevented by browser:', e)
                })
              }
            })
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari supports HLS natively
            video.src = src
            if (autoPlay) {
              video.addEventListener('loadeddata', () => {
                video.play().catch(e => {
                  console.log('Autoplay prevented by browser:', e)
                })
              })
            }
          } else {
            console.error('HLS is not supported in this browser')
          }
        } catch (error) {
          console.error('Failed to load HLS.js:', error)
          // Fallback to native video
          video.src = src
          if (autoPlay) {
            video.addEventListener('loadeddata', () => {
              video.play().catch(e => {
                console.log('Autoplay prevented by browser:', e)
              })
            })
          }
        }
      } else {
        // For non-HLS streams, use native video
        video.src = src
        if (autoPlay) {
          video.addEventListener('loadeddata', () => {
            video.play().catch(e => {
              console.log('Autoplay prevented by browser:', e)
            })
          })
        }
      }
    }

    setupVideo()

    // Clean up on unmount
    return (): void => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [src, autoPlay])

  return (
    <video
      ref={videoRef}
      controls
      muted={autoPlay} // Muted autoplay is more likely to work
      playsInline // Better mobile support
      className={className}
    >
      Your browser does not support the video element.
    </video>
  )
}

// Function to dynamically load HLS.js from CDN
const loadHLSLibrary = (): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { Hls?: unknown }).Hls) {
      resolve((window as unknown as { Hls?: unknown }).Hls)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
    script.onload = (): void => {
      resolve((window as unknown as { Hls?: unknown }).Hls)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Participant Avatar Component
const ParticipantAvatar = ({
  participant,
  size = 'w-6 h-6',
  showTooltip = false
}: {
  participant: {
    pubkey: string;
    profile?: {
      name?: string;
      picture?: string;
    };
    role?: string;
  };
  size?: string;
  showTooltip?: boolean;
}): JSX.Element => (
  <div
    className={`${size} rounded-full overflow-hidden relative ${showTooltip ? 'ring-2 ring-white' : ''}`}
    title={showTooltip ? (participant.profile?.name || participant.pubkey.slice(0, 8)) : undefined}
  >
    {participant.profile?.picture ? (
      <img
        src={participant.profile.picture}
        alt={participant.profile.name || 'Participant'}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
        {(participant.profile?.name || participant.pubkey).slice(0, 2)}
      </div>
    )}
  </div>
)

// Media Player Component
const MediaPlayer = ({
  url,
  type,
  autoPlay = false
}): JSX.Element => {
  if (isHLSStream(url)) {
    return (
      <HLSPlayer
        src={url}
        className="w-full rounded-lg"
        autoPlay={autoPlay}
      />
    )
  }

  if (type === 'video' || type === 'unknown') {
    return (
      <video
        controls
        className="w-full rounded-lg"
        src={url}
      >
        Your browser does not support the video element.
      </video>
    )
  }

  return (
    <audio
      controls
      className="w-full h-12 [&::-webkit-media-controls-panel]:bg-gray-50"
      src={url}
    >
      Your browser does not support the audio element.
    </audio>
  )
}

interface LiveActivityCardProps {
  activity: LiveActivity
}

export default function LiveActivityCard({ activity }: LiveActivityCardProps): JSX.Element {
  const currentStatus = getCurrentStatus(activity)

  const recordingMediaType = activity.recordingUrl ? getMediaType(activity.recordingUrl) : 'unknown'
  const streamingMediaType = activity.streamingUrl ? getMediaType(activity.streamingUrl) : 'unknown'
  const formatDate = (timestamp?: number): string | null => {
    if (!timestamp) return null
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string): JSX.Element | null => {
    switch (status) {
      case 'live':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      case 'planned':
        return <ClockIcon className="w-4 h-4" />
      case 'ended':
        return <CalendarIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition hover:shadow-md">
      <div className="p-6">
        {/* Header with title and status */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex gap-4 items-start flex-1">
            {/* Cover Image */}
            {activity.image && (
              <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden relative">
                <img
                  src={activity.image}
                  alt={activity.title || 'Live Activity'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 leading-tight mb-2">
                {activity.title || 'Untitled Live Activity'}
              </h2>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)} mb-2`}>
                {getStatusIcon(currentStatus)}
                <span className="capitalize">{currentStatus}</span>
              </div>
            </div>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_HTTP_NOSTR_GATEWAY || 'https://njump.me'}/${activity.id}`}
            className="text-sm text-gray-500 whitespace-nowrap hover:text-gray-700 hover:underline"
          >
            {new Date((activity.created_at || 0) * 1000).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </a>
        </div>

        {/* Summary and content */}
        {activity.summary && (
          <p className="text-gray-600 whitespace-pre-line">{activity.summary}</p>
        )}
        {activity.content && (
          <p className="text-gray-600 whitespace-pre-line">{activity.content}</p>
        )}

        {/* Live Stream Player */}
        {activity.streamingUrl && currentStatus === 'live' && (
          <div className="mt-4">
            <MediaPlayer
              url={activity.streamingUrl}
              type={streamingMediaType}
              autoPlay={false}
            />
          </div>
        )}

        {/* Recording Player */}
        {activity.recordingUrl && currentStatus === 'ended' && (
          <div className="mt-4">
            <MediaPlayer
              url={activity.recordingUrl}
              type={recordingMediaType}
              autoPlay={false}
            />
          </div>
        )}

        {/* Timing information */}
        {(activity.starts || activity.ends) && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                <span>Schedule</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {activity.starts && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Starts: {formatDate(activity.starts)}</span>
                  </div>
                )}
                {activity.ends && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Ends: {formatDate(activity.ends)}</span>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Participants */}
        {activity.participants && activity.participants.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                <span>Participants</span>
                <div className="flex items-center">
                  <div className="flex items-center mr-3 -space-x-2 overflow-hidden">
                    {activity.participants?.slice(0, 5).map((participant) => (
                      <ParticipantAvatar
                        key={participant.pubkey}
                        participant={participant}
                        showTooltip={true}
                      />
                    ))}
                  </div>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  {activity.participants?.map((participant) => (
                    <div key={participant.pubkey} className="flex items-center justify-between py-1">
                      <div className="flex items-center">
                        <div className="mr-2">
                          <ParticipantAvatar participant={participant} />
                        </div>
                        <span>{participant.profile?.name || `${participant.pubkey.slice(0, 8)}...`}</span>
                      </div>
                      {participant.role && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {participant.role}
                        </span>
                      )}
                    </div>
                  ))}
                  {activity.currentParticipants && activity.totalParticipants && (
                    <div className="py-2 mt-2 text-xs text-gray-500">
                      Current: {activity.currentParticipants}/{activity.totalParticipants} participants
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Hashtags */}
        {activity.hashtags && activity.hashtags.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                <span>Tags</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {activity.hashtags?.map((hashtag) => (
                    <span
                      key={hashtag}
                      className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded"
                    >
                      #{hashtag}
                    </span>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

function getCurrentStatus(activity: LiveActivity): 'planned' | 'live' | 'ended' {
  // Use explicit status if available
  if (activity.status) return activity.status

  const now = Math.floor(Date.now() / 1000)

  // Determine status based on timestamps
  if (activity.starts && activity.ends) {
    if (now < activity.starts) return 'planned'
    if (now > activity.ends) return 'ended'
    return 'live'
  }

  if (activity.starts && now < activity.starts) return 'planned'
  if (activity.ends && now > activity.ends) return 'ended'

  return 'live' // Default to live if timestamps are unclear
}
