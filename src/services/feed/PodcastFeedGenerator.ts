import { NostrProfile, NostrService } from '../nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// Configure marked to use GitHub Flavored Markdown
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
})

interface ValueSplit {
  pubkey: string
  percentage: number
  lightningAddress?: string
  name?: string
  nodeId?: string
}

export class PodcastFeedGenerator {
  constructor(private nostrService?: NostrService) {}

  generateFeed(profile: NostrProfile, events: NDKEvent[], npub: string, longFormMap?: Map<string, NDKEvent>): string {
    const title = profile.name || npub
    const description = profile.about || 'A media feed generated from Nostr posts'
    const link = `https://castr.me/${npub}`
    const language = 'en-us'
    const pubDate = new Date().toUTCString()
    const image = profile.picture || `https://robohash.org/${npub}.png?set=set3&size=500x500`
    
    // Filter for media events and sort by date
    const mediaEvents = this.filterMediaEvents(events)
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    
    // Generate items XML (synchronous for now, will enhance with async later)
    const items = mediaEvents.map(event => this.generateItem(event, longFormMap)).join('\n')
    
    // Generate value tag for channel-level default (prefer keysend if nodeid exists, else lnaddress)
    const valueTag = profile.nodeid ? `
    <podcast:value type="lightning" method="keysend" suggested="0.00021">
      <podcast:valueRecipient 
        name="${this.escapeXml(title)}"
        type="node"
        address="${this.escapeXml(profile.nodeid)}"
        split="100"
      />
    </podcast:value>` : (profile.lud16 ? `
    <podcast:value type="lightning" method="lnaddress" suggested="0.00021">
      <podcast:valueRecipient 
        name="${this.escapeXml(title)}"
        type="lnaddress"
        address="${this.escapeXml(profile.lud16)}"
        split="100"
      />
    </podcast:value>` : '')
    
    // Generate the complete RSS feed
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/" xmlns:podcast="https://podcastindex.org/namespace/1.0">
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
    <itunes:explicit>false</itunes:explicit>${valueTag}
    ${items}
  </channel>
</rss>`
  }
  
  /**
   * Async version of generateFeed that fetches recipient information
   */
  async generateFeedAsync(profile: NostrProfile, events: NDKEvent[], npub: string, longFormMap?: Map<string, NDKEvent>): Promise<string> {
    const title = profile.name || npub
    const description = profile.about || 'A media feed generated from Nostr posts'
    const link = `https://castr.me/${npub}`
    const language = 'en-us'
    const pubDate = new Date().toUTCString()
    const image = profile.picture || `https://robohash.org/${npub}.png?set=set3&size=500x500`
    
    // Filter for media events and sort by date
    const mediaEvents = this.filterMediaEvents(events)
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    
    // Generate items XML with async recipient fetching
    const itemsPromises = mediaEvents.map(event => this.generateItemAsync(event, longFormMap, profile, npub))
    const items = await Promise.all(itemsPromises)
    const itemsXml = items.join('\n')
    
    // Generate value tag for channel-level default (prefer keysend if nodeid exists, else lnaddress)
    const valueTag = profile.nodeid ? `
    <podcast:value type="lightning" method="keysend" suggested="0.00021">
      <podcast:valueRecipient 
        name="${this.escapeXml(title)}"
        type="node"
        address="${this.escapeXml(profile.nodeid)}"
        split="100"
      />
    </podcast:value>` : (profile.lud16 ? `
    <podcast:value type="lightning" method="lnaddress" suggested="0.00021">
      <podcast:valueRecipient 
        name="${this.escapeXml(title)}"
        type="lnaddress"
        address="${this.escapeXml(profile.lud16)}"
        split="100"
      />
    </podcast:value>` : '')
    
    // Generate the complete RSS feed
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/" xmlns:podcast="https://podcastindex.org/namespace/1.0">
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
    <itunes:explicit>false</itunes:explicit>${valueTag}
    ${itemsXml}
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
  
  private generateItem(event: NDKEvent, longFormMap?: Map<string, NDKEvent>): string {
    const audioUrl = this.extractAudioUrl(event.content)
    const videoUrl = this.extractVideoUrl(event.content)
    if (!audioUrl && !videoUrl) return ''

    const title = this.extractTitle(event)
    const pubDate = new Date((event.created_at || 0) * 1000).toUTCString()
    const guid = event.id
    const mediaType = videoUrl ? 'video' : 'audio'
    const mediaUrl = videoUrl || audioUrl || ''
    const imageUrl = this.extractImage(event)

    // Extract show notes from long-form content if available
    const showNotes = this.extractShowNotes(event)
    const content = showNotes || event.content

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(content, { async: false }) as string)

    // Generate itunes:image tag if image exists
    const imageTag = imageUrl ? `\n      <itunes:image href="${this.escapeXml(imageUrl)}"/>` : ''

    // Generate value splits for this item (synchronous version for now)
    const valueSplits = this.generateValueSplitsForEventSync(event, longFormMap)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''
    return `    <item>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(mediaUrl)}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${htmlContent}]]></description>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'}" />
      <media:content url="${this.escapeXml(mediaUrl)}" type="${mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'}" />
      <itunes:title>${this.escapeXml(title)}</itunes:title>
      <itunes:author>${this.escapeXml(event.pubkey)}</itunes:author>
      <itunes:summary><![CDATA[${htmlContent}]]></itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>${imageTag}${valueTag}
    </item>`
  }
  
  /**
   * Generates value splits for a specific event based on the priority order:
   * 1. Associated long-form content (kind:30023) zap splits (highest priority)
   * 2. Kind:1 event zap splits
   * 3. Default profile lightning address (lowest priority)
   */
  private generateValueSplitsForEventSync(event: NDKEvent, longFormMap?: Map<string, NDKEvent>): ValueSplit[] {
    const title = this.extractTitle(event)
    
    // Priority 1: Check associated long-form content (kind:30023) for zap splits
    if (longFormMap) {
      const longFormEvent = longFormMap.get(title)
      if (longFormEvent) {
        const longFormSplits = this.nostrService?.extractZapSplitsWithPercentages(longFormEvent) || []
        if (longFormSplits.length > 0) {
          return longFormSplits.map(split => ({
            pubkey: split.pubkey,
            percentage: split.percentage
          }))
        }
      }
    }
    
    // Priority 2: Check kind:1 event for zap splits
    const kind1Splits = this.nostrService?.extractZapSplitsWithPercentages(event) || []
    if (kind1Splits.length > 0) {
      return kind1Splits.map(split => ({
        pubkey: split.pubkey,
        percentage: split.percentage
      }))
    }
    
    // Priority 3: Return empty array (will fall back to channel-level default)
    return []
  }
  
  /**
   * Generates the Podcast 2.0 value tag XML for value splits
   */
  private generateValueTag(splits: ValueSplit[]): string {
    if (splits.length === 0) {
      return ''
    }
    
    // Build lnaddress recipients only when recipient has NO nodeId (fallback to synthetic lnaddress if needed)
    const lnRecipients = splits.filter(split => !split.nodeId).map(split => {
      const name = split.name || `Recipient ${split.pubkey.substring(0, 8)}`
      const address = split.lightningAddress || `recipient@${split.pubkey.substring(0, 8)}.ln`
      return `        <podcast:valueRecipient 
          name="${this.escapeXml(name)}"
          type="lnaddress"
          address="${this.escapeXml(address)}"
          split="${split.percentage}"
        />`
    }).join('\n')

    // Build keysend recipients for those with a nodeId
    const keysendRecipients = splits.filter(split => !!split.nodeId).map(split => {
      const name = split.name || `Recipient ${split.pubkey.substring(0, 8)}`
      return `        <podcast:valueRecipient 
          name="${this.escapeXml(name)}"
          type="node"
          address="${this.escapeXml(split.nodeId as string)}"
          split="${split.percentage}"
        />`
    }).join('\n')

    const lnBlock = lnRecipients ? `
      <podcast:value type="lightning" method="lnaddress" suggested="0.00021">
${lnRecipients}
      </podcast:value>` : ''

    const keysendBlock = keysendRecipients ? `
      <podcast:value type="lightning" method="keysend" suggested="0.00021">
${keysendRecipients}
      </podcast:value>` : ''

    return `${keysendBlock}${lnBlock}`
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

  private extractShowNotes(event: NDKEvent): string | null {
    // Try to find a show notes tag
    const showNotesTag = event.tags.find(tag => tag[0] === 'show_notes')
    if (showNotesTag) return showNotesTag[1]

    // Try to find a d tag (identifier) that might link to long-form content
    const dTag = event.tags.find(tag => tag[0] === 'd')
    if (dTag) {
      // If we have a d tag, it might be a reference to long-form content
      // We'll need to fetch the long-form content separately
      return null
    }

    return null
  }

  private extractImage(event: NDKEvent): string | undefined {
    // Try to find an image tag
    const imageTag = event.tags.find(tag => tag[0] === 'image')
    if (imageTag) return imageTag[1]

    // Try to find an image URL in r tags (reference/resource tags)
    const rTags = event.tags.filter(tag => tag[0] === 'r' && tag.length > 1)
    for (const tag of rTags) {
      const url = tag[1]
      if (/\.(?:jpg|jpeg|png|gif|webp)$/i.test(url)) {
        return url
      }
    }

    // Try to find an image URL in the content
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i
    const match = event.content.match(imageRegex)
    return match ? match[0] : undefined
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

  /**
   * Async version of generateItem that fetches recipient information
   */
  private async generateItemAsync(event: NDKEvent, longFormMap?: Map<string, NDKEvent>, profile?: NostrProfile, npub?: string): Promise<string> {
    const audioUrl = this.extractAudioUrl(event.content)
    const videoUrl = this.extractVideoUrl(event.content)
    if (!audioUrl && !videoUrl) return ''

    const title = this.extractTitle(event)
    const pubDate = new Date((event.created_at || 0) * 1000).toUTCString()
    const guid = event.id
    const mediaType = videoUrl ? 'video' : 'audio'
    const mediaUrl = videoUrl || audioUrl || ''
    const imageUrl = this.extractImage(event)

    // Extract show notes from long-form content if available
    const showNotes = this.extractShowNotes(event)
    const content = showNotes || event.content

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(content, { async: false }) as string)

    // Generate itunes:image tag if image exists
    const imageTag = imageUrl ? `\n      <itunes:image href="${this.escapeXml(imageUrl)}"/>` : ''

    // Generate value splits for this item with recipient information
    const valueSplits = await this.generateValueSplitsForEventAsync(event, longFormMap, profile, npub)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    return `    <item>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(mediaUrl)}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${htmlContent}]]></description>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'}" />
      <media:content url="${this.escapeXml(mediaUrl)}" type="${mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'}" />
      <itunes:title>${this.escapeXml(title)}</itunes:title>
      <itunes:author>${this.escapeXml(event.pubkey)}</itunes:author>
      <itunes:summary><![CDATA[${htmlContent}]]></itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>${imageTag}${valueTag}
    </item>`
  }
  
  /**
   * Async version that fetches recipient lightning addresses and names
   */
  private async generateValueSplitsForEventAsync(event: NDKEvent, longFormMap?: Map<string, NDKEvent>, profile?: NostrProfile, npub?: string): Promise<ValueSplit[]> {
    const title = this.extractTitle(event)
    
    // Priority 1: Check associated long-form content (kind:30023) for zap splits
    if (longFormMap) {
      const longFormEvent = longFormMap.get(title)
      if (longFormEvent) {
        const longFormSplits = await this.nostrService?.fetchZapSplitsWithRecipients(longFormEvent) || []
        if (longFormSplits.length > 0) {
          return longFormSplits
        }
      }
    }
    
    // Priority 2: Check kind:1 event for zap splits
    const kind1Splits = await this.nostrService?.fetchZapSplitsWithRecipients(event) || []
    if (kind1Splits.length > 0) {
      return kind1Splits
    }
    
    // Priority 3: Use profile defaults as 100% (prefer nodeid over lnaddress)
    if (profile && npub) {
      const nodeId = profile.nodeid
      if (nodeId) {
        return [{
          pubkey: npub,
          percentage: 100,
          name: profile.name || npub,
          nodeId
        }]
      }
      if (profile.lud16) {
        return [{
          pubkey: npub,
          percentage: 100,
          lightningAddress: profile.lud16,
          name: profile.name || npub
        }]
      }
    }
    
    // Priority 4: Return empty array (will fall back to channel-level default)
    return []
  }
} 