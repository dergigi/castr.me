/**
 * Centralized MIME type detection utilities
 * Consolidates all MIME type detection logic across the application
 */

export interface MediaTypeInfo {
  mimeType: string;
  category: 'audio' | 'video' | 'unknown';
  isStream: boolean;
}

/**
 * Get comprehensive media type information from a URL
 */
export function getMediaTypeInfo(url: string): MediaTypeInfo {
  if (!url) {
    return {
      mimeType: 'audio/mpeg',
      category: 'unknown',
      isStream: false
    };
  }

  const lowerUrl = url.toLowerCase();

  // Streaming formats
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('hls')) {
    return {
      mimeType: 'application/x-mpegURL',
      category: 'video',
      isStream: true
    };
  }

  if (lowerUrl.includes('.mpd') || lowerUrl.includes('dash')) {
    return {
      mimeType: 'application/dash+xml',
      category: 'video',
      isStream: true
    };
  }

  // WebRTC/RTMP streams
  if (lowerUrl.startsWith('rtmp://') || lowerUrl.startsWith('rtsp://')) {
    return {
      mimeType: 'video/mp4',
      category: 'video',
      isStream: true
    };
  }

  // YouTube/Twitch-style streams
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('twitch.tv')) {
    return {
      mimeType: 'application/x-mpegURL',
      category: 'video',
      isStream: true
    };
  }

  // Video formats
  if (lowerUrl.includes('.mp4')) {
    return {
      mimeType: 'video/mp4',
      category: 'video',
      isStream: false
    };
  }

  if (lowerUrl.includes('.webm')) {
    return {
      mimeType: 'video/webm',
      category: 'video',
      isStream: false
    };
  }

  if (lowerUrl.includes('.mov')) {
    return {
      mimeType: 'video/quicktime',
      category: 'video',
      isStream: false
    };
  }

  if (lowerUrl.includes('.avi')) {
    return {
      mimeType: 'video/x-msvideo',
      category: 'video',
      isStream: false
    };
  }

  if (lowerUrl.includes('.mkv')) {
    return {
      mimeType: 'video/x-matroska',
      category: 'video',
      isStream: false
    };
  }

  // Audio formats
  if (lowerUrl.includes('.mp3')) {
    return {
      mimeType: 'audio/mpeg',
      category: 'audio',
      isStream: false
    };
  }

  if (lowerUrl.includes('.m4a') || lowerUrl.includes('.aac')) {
    return {
      mimeType: 'audio/mp4',
      category: 'audio',
      isStream: false
    };
  }

  if (lowerUrl.includes('.wav')) {
    return {
      mimeType: 'audio/wav',
      category: 'audio',
      isStream: false
    };
  }

  if (lowerUrl.includes('.ogg')) {
    return {
      mimeType: 'audio/ogg',
      category: 'audio',
      isStream: false
    };
  }

  if (lowerUrl.includes('.flac')) {
    return {
      mimeType: 'audio/flac',
      category: 'audio',
      isStream: false
    };
  }

  // Default fallback
  return {
    mimeType: 'audio/mpeg',
    category: 'unknown',
    isStream: false
  };
}

/**
 * Get just the MIME type string (backward compatibility)
 */
export function getMimeType(url: string): string {
  return getMediaTypeInfo(url).mimeType;
}

/**
 * Get just the media category (backward compatibility)
 */
export function getMediaCategory(url: string): 'audio' | 'video' | 'unknown' {
  return getMediaTypeInfo(url).category;
}

/**
 * Check if URL is an HLS stream
 */
export function isHLSStream(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.m3u8') || lowerUrl.includes('hls');
}

/**
 * Check if URL is a DASH stream
 */
export function isDASHStream(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mpd') || lowerUrl.includes('dash');
}

/**
 * Check if URL is any kind of streaming format
 */
export function isStreamingFormat(url: string): boolean {
  return getMediaTypeInfo(url).isStream;
}

/**
 * Check if content contains media URLs (for NostrService compatibility)
 */
export function hasAudioContent(content: string): boolean {
  if (!content) return false;
  const lowerContent = content.toLowerCase();
  return (
    lowerContent.includes('.mp3') ||
    lowerContent.includes('.m4a') ||
    lowerContent.includes('.wav') ||
    lowerContent.includes('.ogg') ||
    lowerContent.includes('.aac') ||
    lowerContent.includes('.flac')
  );
}

/**
 * Check if content contains video URLs (for NostrService compatibility)
 */
export function hasVideoContent(content: string): boolean {
  if (!content) return false;
  const lowerContent = content.toLowerCase();
  return (
    lowerContent.includes('.mp4') ||
    lowerContent.includes('.webm') ||
    lowerContent.includes('.mov') ||
    lowerContent.includes('.avi') ||
    lowerContent.includes('.mkv') ||
    lowerContent.includes('.m3u8') ||
    lowerContent.includes('.mpd')
  );
}

/**
 * Check if content contains any media URLs
 */
export function hasMediaContent(content: string): boolean {
  return hasAudioContent(content) || hasVideoContent(content);
}

/**
 * Extract audio URL from content using regex (for NostrService compatibility)
 */
export function extractAudioUrl(content: string): string | undefined {
  const urlRegex = /(https?:\/\/[^\s]+\.(?:mp3|m4a|wav|ogg|aac|flac))/i;
  const match = content.match(urlRegex);
  return match ? match[1] : undefined;
}

/**
 * Extract video URL from content using regex (for NostrService compatibility)
 */
export function extractVideoUrl(content: string): string | undefined {
  const urlRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|mov|avi|mkv|m3u8|mpd))/i;
  const match = content.match(urlRegex);
  return match ? match[1] : undefined;
}
