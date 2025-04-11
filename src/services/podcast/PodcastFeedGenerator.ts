import { NDKUser } from "@nostr-dev-kit/ndk";
import { AudioEvent } from "../../types";

export class PodcastFeedGenerator {
  generateFeed(profile: NDKUser, events: AudioEvent[]): string {
    const title = profile.profile?.name || 'Unknown Podcast';
    const description = profile.profile?.about || 'No description available';
    const image = profile.profile?.image || 'https://via.placeholder.com/150';
    const link = `https://castr.app/${profile.npub}`;

    const items = events.map(event => `
      <item>
        <title>${event.title}</title>
        <description>${event.content}</description>
        <enclosure url="${event.audioUrl}" type="audio/mpeg" length="0"/>
        <guid>${event.id}</guid>
        <pubDate>${new Date(event.created_at * 1000).toUTCString()}</pubDate>
      </item>
    `).join('\n');

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
    <itunes:author>${profile.profile?.name || 'Unknown'}</itunes:author>
    <itunes:summary>${description}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`;
  }
} 