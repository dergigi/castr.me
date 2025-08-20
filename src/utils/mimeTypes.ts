/**
 * Centralized MIME type detection utilities
 * Consolidates all MIME type detection logic across the application
 */

export interface MediaTypeInfo {
  mimeType: string;
  category: 'audio' | 'video' | 'unknown';
}

/**
 * Get comprehensive media type information from a URL
 */
export function getMediaTypeInfo(url: string): MediaTypeInfo {
  if (!url) {
    return {
      mimeType: 'audio/mpeg',
      category: 'unknown',
    };
  }

  const lowerUrl = url.toLowerCase();

  // Streaming formats
  if (lowerUrl.endsWith('.m3u8')) {
    return {
      mimeType: 'application/x-mpegURL',
      category: 'video',
    };
  }

  if (lowerUrl.endsWith('.mpd')) {
    return {
      mimeType: 'application/dash+xml',
      category: 'video',
    };
  }

  // Video formats
  if (lowerUrl.endsWith('.mp4')) {
    return {
      mimeType: 'video/mp4',
      category: 'video',
    };
  }

  if (lowerUrl.endsWith('.webm')) {
    return {
      mimeType: 'video/webm',
      category: 'video',
    };
  }

  if (lowerUrl.endsWith('.mov')) {
    return {
      mimeType: 'video/quicktime',
      category: 'video',
    };
  }

  if (lowerUrl.endsWith('.avi')) {
    return {
      mimeType: 'video/x-msvideo',
      category: 'video',
    };
  }

  if (lowerUrl.endsWith('.mkv')) {
    return {
      mimeType: 'video/x-matroska',
      category: 'video',
    };
  }

  // Audio formats
  if (lowerUrl.endsWith('.mp3')) {
    return {
      mimeType: 'audio/mpeg',
      category: 'audio',
    };
  }

  if (lowerUrl.endsWith('.m4a') || lowerUrl.endsWith('.aac')) {
    return {
      mimeType: 'audio/mp4',
      category: 'audio',
    };
  }

  if (lowerUrl.endsWith('.wav')) {
    return {
      mimeType: 'audio/wav',
      category: 'audio',
    };
  }

  if (lowerUrl.endsWith('.ogg')) {
    return {
      mimeType: 'audio/ogg',
      category: 'audio',
    };
  }

  if (lowerUrl.endsWith('.flac')) {
    return {
      mimeType: 'audio/flac',
      category: 'audio',
    };
  }

  // Default fallback
  return {
    mimeType: 'audio/mpeg',
    category: 'unknown',
  };
}

/**
 * Get just the MIME type string (backward compatibility)
 */
export function getMimeType(url: string): string {
  return getMediaTypeInfo(url).mimeType;
}

/**
 * Check if URL is an HLS stream
 */
export function isHLSStream(url: string): boolean {
  return getMediaTypeInfo(url).mimeType === 'application/x-mpegURL'
}

/**
 * Check if content contains audio URLs
 */
export function hasAudioContent(content: string): boolean {
  return getMediaTypeInfo(content).category === 'audio'
}

/**
 * Check if content contains audio or video URLs
 */
export function hasMediaContent(content: string): boolean {
  return getMediaTypeInfo(content).category === 'audio' || getMediaTypeInfo(content).category === 'video'
}
