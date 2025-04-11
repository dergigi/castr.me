import { PodcastFeed, AudioEvent } from "../../types";
import { NDKUserProfile } from "@nostr-dev-kit/ndk";

export class PodcastFeedGenerator {
  generateFeed(profile: NDKUserProfile, events: AudioEvent[]): string {
    const feed: PodcastFeed = {
      title: profile.name || 'Untitled Podcast',
      description: profile.about || '',
      image: profile.image,
      author: profile.name || '',
      email: profile.nip05,
      items: events.map(event => ({
        title: event.title || 'Untitled Episode',
        description: event.content,
        audioUrl: event.audioUrl!,
        pubDate: new Date(event.created_at * 1000),
        author: profile.name
      }))
    };

    return this.generateXML(feed);
  }

  private generateXML(feed: PodcastFeed): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:podcast="https://podcastindex.org/namespace/1.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${this.escapeXml(feed.title)}</title>
    <description>${this.escapeXml(feed.description)}</description>
    ${feed.image ? `<image><url>${this.escapeXml(feed.image)}</url></image>` : ''}
    <author>${this.escapeXml(feed.author)}</author>
    ${feed.email ? `<itunes:author>${this.escapeXml(feed.email)}</itunes:author>` : ''}
    <podcast:medium>podcast</podcast:medium>
    ${feed.items.map(item => this.generateItemXML(item)).join('\n    ')}
  </channel>
</rss>`;
  }

  private generateItemXML(item: PodcastFeed['items'][0]): string {
    return `<item>
      <title>${this.escapeXml(item.title)}</title>
      ${item.description ? `<description>${this.escapeXml(item.description)}</description>` : ''}
      <enclosure url="${this.escapeXml(item.audioUrl)}" type="audio/mpeg" />
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      ${item.author ? `<itunes:author>${this.escapeXml(item.author)}</itunes:author>` : ''}
      ${item.duration ? `<itunes:duration>${this.escapeXml(item.duration)}</itunes:duration>` : ''}
    </item>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
} 