/**
 * Centralized MIME type detection utilities
 * Consolidates all MIME type detection logic across the application
 */

export interface MediaTypeInfo {
  mimeType: string;
  category: 'audio' | 'video' | 'unknown';
}

// MIME type mapping by file extension
const MEDIA_TYPES: Record<string, MediaTypeInfo> = {
  // Streaming
  '.m3u8': { mimeType: 'application/x-mpegURL', category: 'video' },
  '.mpd': { mimeType: 'application/dash+xml', category: 'video' },

  // Video
  '.mp4': { mimeType: 'video/mp4', category: 'video' },
  '.webm': { mimeType: 'video/webm', category: 'video' },
  '.mov': { mimeType: 'video/quicktime', category: 'video' },
  '.avi': { mimeType: 'video/x-msvideo', category: 'video' },
  '.mkv': { mimeType: 'video/x-matroska', category: 'video' },

  // Audio
  '.mp3': { mimeType: 'audio/mpeg', category: 'audio' },
  '.m4a': { mimeType: 'audio/mp4', category: 'audio' },
  '.aac': { mimeType: 'audio/mp4', category: 'audio' },
  '.wav': { mimeType: 'audio/wav', category: 'audio' },
  '.ogg': { mimeType: 'audio/ogg', category: 'audio' },
  '.flac': { mimeType: 'audio/flac', category: 'audio' },
};

const UNKNOWN_TYPE: MediaTypeInfo = {
  mimeType: 'audio/mpeg',
  category: 'unknown',
};

function getExtension(url: string): string {
  return url.toLowerCase().match(/\.\w+$/)?.[0] || '';
}

export function getMediaTypeInfo(url: string): MediaTypeInfo {
  const ext = getExtension(url);
  return MEDIA_TYPES[ext] || UNKNOWN_TYPE;
}

export function getMimeType(url: string): string {
  return getMediaTypeInfo(url).mimeType;
}

export function isHLSStream(url: string): boolean {
  return getMediaTypeInfo(url).mimeType === 'application/x-mpegURL';
}

export function hasMediaContent(content: string): boolean {
  const category = getMediaTypeInfo(content).category;
  return category === 'audio' || category === 'video';
}