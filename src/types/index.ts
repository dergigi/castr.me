export interface MediaEvent {
  id: string;
  pubkey: string;
  created_at: number;
  content: string;
  tags: string[][];
  sig: string;
  audioUrl?: string;
  videoUrl?: string;
  mediaType?: 'audio' | 'video';
  title?: string;
}

export interface PodcastFeed {
  title: string;
  description: string;
  image?: string;
  author: string;
  email?: string;
  items: PodcastItem[];
}

export interface PodcastItem {
  title: string;
  description?: string;
  audioUrl: string;
  pubDate: Date;
  duration?: string;
  author?: string;
}

// NIP-53 Live Activities Support
export interface LiveActivity {
  id: string;
  naddr: string;
  pubkey: string;
  created_at: number;
  content: string;
  tags: string[][];
  sig: string;
  // Parsed fields from tags
  identifier?: string; // d tag
  title?: string;
  summary?: string;
  image?: string;
  hashtags?: string[]; // t tags
  streamingUrl?: string;
  recordingUrl?: string;
  starts?: number; // Unix timestamp
  ends?: number; // Unix timestamp
  status?: 'planned' | 'live' | 'ended';
  currentParticipants?: number;
  totalParticipants?: number;
  participants?: LiveActivityParticipant[];
  relays?: string[];
}

export interface LiveActivityParticipant {
  pubkey: string;
  relay?: string;
  role?: 'Host' | 'Speaker' | 'Participant';
  proof?: string; // Proof of agreement to participate
  profile?: {
    name?: string;
    picture?: string;
  };
}