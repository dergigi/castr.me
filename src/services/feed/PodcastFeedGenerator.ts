import { NostrProfile } from '../nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'

export class PodcastFeedGenerator {
  generateFeed(profile: NostrProfile, events: NDKEvent[]): string {
    const title = profile.name || 'Anonymous Podcast'
    const description = profile.about || 'A podcast feed generated from Nostr posts'
    const link = `https://pubcaster.vercel.app/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n`
    const language = 'en-us'
    const pubDate = new Date().toUTCString()
    
    // Filter for audio events and sort by date
    const audioEvents = this.filterAudioEvents(events)
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    
    // Generate items XML
    const items = audioEvents.map(event => this.generateItem(event)).join('\n')
    
    // Generate the complete RSS feed
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${this.escapeXml(title)}</title>
    <link>${this.escapeXml(link)}</link>
    <description>${this.escapeXml(description)}</description>
    <language>${language}</language>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <itunes:author>${this.escapeXml(profile.name || 'Anonymous')}</itunes:author>
    <itunes:summary>${this.escapeXml(description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`
  }
  
  private filterAudioEvents(events: NDKEvent[]): NDKEvent[] {
    return events.filter(event => this.isAudioEvent(event))
  }
  
  private isAudioEvent(event: NDKEvent): boolean {
    const content = event.content
    return (
      content.includes('.mp3') ||
      content.includes('.m4a') ||
      content.includes('.wav') ||
      content.includes('.ogg')
    )
  }
  
  private generateItem(event: NDKEvent): string {
    const audioUrl = this.extractAudioUrl(event.content)
    if (!audioUrl) return ''
    
    const title = this.extractTitle(event)
    const pubDate = new Date((event.created_at || 0) * 1000).toUTCString()
    const guid = event.id
    
    return `    <item>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(audioUrl)}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${this.escapeXml(audioUrl)}" type="audio/mpeg" />
      <itunes:title>${this.escapeXml(title)}</itunes:title>
      <itunes:author>${this.escapeXml(event.pubkey)}</itunes:author>
      <itunes:summary>${this.escapeXml(event.content)}</itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`
  }
  
  private extractAudioUrl(content: string): string | undefined {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:mp3|m4a|wav|ogg))/i
    const match = content.match(urlRegex)
    return match ? match[0] : undefined
  }
  
  private extractTitle(event: NDKEvent): string {
    // Try to find a title tag
    const titleTag = event.tags.find(tag => tag[0] === 'title')
    if (titleTag) return titleTag[1]
    
    // Otherwise, use the first line of content or a truncated version
    const firstLine = event.content.split('\n')[0]
    return firstLine.length > 100 ? `${firstLine.substring(0, 97)}...` : firstLine
  }
  
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
} 