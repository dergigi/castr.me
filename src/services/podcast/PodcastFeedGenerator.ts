import { NDKUser } from "@nostr-dev-kit/ndk";
import { MediaEvent } from "../../types";

/**
 * Generates an RSS feed for audio podcasts.
 * Note: This generator only includes audio content as it follows the podcast RSS specification.
 * Video content is not included in the feed as it's meant for web viewing only.
 */
export class PodcastFeedGenerator {
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

  generateFeed(profile: NDKUser, events: MediaEvent[]): string {
    const name = profile.profile?.name ?? 'Unknown Podcast';
    const about = profile.profile?.about ?? 'No description available';
    const title = this.escapeXml(name);
    const description = this.escapeXml(about);
    const image = profile.profile?.image || 'https://via.placeholder.com/150';
    const link = `https://castr.me/${profile.npub}`;

    const items = events.map(event => {
      const eventTitle = event.title || 'Untitled Episode';
      const eventContent = event.content || '';
      const audioUrl = event.audioUrl || '';
      
      return `
      <item>
        <title>${this.escapeXml(eventTitle)}</title>
        <description>${this.escapeXml(eventContent)}</description>
        <enclosure url="${this.escapeXml(audioUrl)}" type="audio/mpeg" length="0"/>
        <guid>${event.id}</guid>
        <pubDate>${new Date(event.created_at * 1000).toUTCString()}</pubDate>
      </item>
    `}).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${title}</title>
    <description>${description}</description>
    <link>${link}</link>
    <image>
      <url>${image}</url>
      <title>${title}</title>
      <link>${link}</link>
    </image>
    <itunes:image href="${image}"/>
    <language>en-us</language>
    <itunes:author>${title}</itunes:author>
    <itunes:summary>${description}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`;
  }
} 