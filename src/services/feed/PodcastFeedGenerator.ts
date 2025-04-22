import { NostrProfile } from '../nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'

export class PodcastFeedGenerator {
  generateFeed(profile: NostrProfile, events: NDKEvent[], npub: string): string {
    const title = profile.name || npub
    const description = profile.about || 'A media feed generated from Nostr posts'
    const link = `https://castr.me/${npub}`
    const language = 'en-us'
    const pubDate = new Date().toUTCString()
    const image = profile.picture || `https://robohash.org/${npub}.png?set=set3&size=500x500`
    
    // Filter for media events and sort by date
    const mediaEvents = this.filterMediaEvents(events)
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    
    // Generate items XML
    const items = mediaEvents.map(event => this.generateItem(event)).join('\n')
    
    // Generate the complete RSS feed
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${this.escapeXml(title)}</title>
    <link>${this.escapeXml(link)}</link>
    <description>${this.escapeXml(description)}</description>
    <language>${language}</language>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <image>
      <url>${this.escapeXml(image)}</url>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(link)}</link>
    </image>
    <itunes:image href="${this.escapeXml(image)}"/>
    <itunes:author>${this.escapeXml(profile.name || npub)}</itunes:author>
    <itunes:summary>${this.escapeXml(description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`
  }
  
  private filterMediaEvents(events: NDKEvent[]): NDKEvent[] {
    return events.filter(event => this.isMediaEvent(event))
  }
  
  private isMediaEvent(event: NDKEvent): boolean {
    const content = event.content
    return (
      content.includes('.mp3') ||
      content.includes('.m4a') ||
      content.includes('.wav') ||
      content.includes('.ogg') ||
      content.includes('.mp4') ||
      content.includes('.webm') ||
      content.includes('.mov')
    )
  }
  
  private generateItem(event: NDKEvent): string {
    const audioUrl = this.extractAudioUrl(event.content)
    const videoUrl = this.extractVideoUrl(event.content)
    if (!audioUrl && !videoUrl) return ''
    
    const title = this.extractTitle(event)
    const pubDate = new Date((event.created_at || 0) * 1000).toUTCString()
    const guid = event.id
    const mediaType = videoUrl ? 'video' : 'audio'
    const mediaUrl = videoUrl || audioUrl || ''
    
    return `    <item>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(mediaUrl)}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'}" />
      <media:content url="${this.escapeXml(mediaUrl)}" type="${mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'}" />
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
  
  private extractVideoUrl(content: string): string | undefined {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|mov))/i
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
    return unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case "'": return '&apos;'
        case '"': return '&quot;'
        default: return c
      }
    })
  }
} 