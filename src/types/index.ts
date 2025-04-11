export interface AudioEvent {
  id: string;
  pubkey: string;
  created_at: number;
  content: string;
  tags: string[][];
  sig: string;
  audioUrl?: string;
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