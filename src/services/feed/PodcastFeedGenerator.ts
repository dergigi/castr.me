import { NostrProfile, NostrService } from '../nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { LiveActivity } from '../../types'
import { getMimeType } from '../../utils/mimeTypes'
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

  generateFeed(profile: NostrProfile, events: NDKEvent[], npub: string, longFormMap?: Map<string, NDKEvent>, liveActivities?: NDKEvent[]): string {
    const title = profile.name || npub
    const description = profile.about || 'A media feed generated from Nostr posts'
    const link = `https://castr.me/${npub}`
    const language = 'en-us'
    const pubDate = new Date().toUTCString()
    const image = profile.picture || `https://robohash.org/${npub}.png?set=set3&size=500x500`
    
    // Filter for media events and sort by date
    const mediaEvents = [
      ...this.filterMediaEvents(events),
      ...(liveActivities || [])
    ].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))

    // Generate items XML (synchronous for now, will enhance with async later)
    const items = mediaEvents.map(event => {
      if (event.kind === 30311) {
        return this.generateLiveActivityItem(event)
      } else {
        return this.generateItem(event, longFormMap)
      }
    }).join('\n')

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
  async generateFeedAsync(profile: NostrProfile, events: NDKEvent[], npub: string, longFormMap?: Map<string, NDKEvent>, liveActivities?: NDKEvent[]): Promise<string> {
    const title = profile.name || npub
    const description = profile.about || 'A media feed generated from Nostr posts'
    const link = `https://castr.me/${npub}`
    const language = 'en-us'
    const pubDate = new Date().toUTCString()
    const image = profile.picture || `https://robohash.org/${npub}.png?set=set3&size=500x500`

    // Filter for media events and sort by date
    const mediaEvents = [
      ...this.filterMediaEvents(events),
      ...(liveActivities || [])
    ].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))

      // Generate items XML with async recipient fetching
    const itemsPromises: Promise<string>[] = mediaEvents.map(event => {
      if (event.kind === 30311) {
        return this.generateLiveActivityItemAsync(event)
      } else {
        return this.generateItemAsync(event, longFormMap, profile, npub)
      }
    })

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
    const mediaUrl = videoUrl || audioUrl || ''
    const mimeType = getMimeType(mediaUrl)
    
    // Extract show notes from long-form content if available
    const showNotes = this.extractShowNotes(event)
    const content = showNotes || event.content
    
    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(content, { async: false }) as string)
    
    // Generate value splits for this item (synchronous version for now)
    const valueSplits = this.generateValueSplitsForEventSync(event, longFormMap)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    return `    <item>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(mediaUrl)}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${htmlContent}]]></description>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mimeType}" length="0" />
      <media:content url="${this.escapeXml(mediaUrl)}" type="${mimeType}" />
      <itunes:title>${this.escapeXml(title)}</itunes:title>
      <itunes:author>${this.escapeXml(event.pubkey)}</itunes:author>
      <itunes:summary><![CDATA[${htmlContent}]]></itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>${valueTag}
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
    const mediaUrl = videoUrl || audioUrl || ''
    const mimeType = getMimeType(mediaUrl)
    
    // Extract show notes from long-form content if available
    const showNotes = this.extractShowNotes(event)
    const content = showNotes || event.content
    
    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(content, { async: false }) as string)
    
    // Generate value splits for this item with recipient information
    const valueSplits = await this.generateValueSplitsForEventAsync(event, longFormMap, profile, npub)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    return `    <item>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(mediaUrl)}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${htmlContent}]]></description>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mimeType}" length="0" />
      <media:content url="${this.escapeXml(mediaUrl)}" type="${mimeType}" />
      <itunes:title>${this.escapeXml(title)}</itunes:title>
      <itunes:author>${this.escapeXml(event.pubkey)}</itunes:author>
      <itunes:summary><![CDATA[${htmlContent}]]></itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>${valueTag}
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

  /**
   * Generates RSS item for a Live Activity with recording (ended activities)
   */
  private buildLiveRecordingItem(activity: LiveActivity, valueTag?: string): string {
    // Only include live activities that have recording URLs
    if (!activity.recordingUrl) return ''

    const title = activity.title || ''
    const link = `${process.env.NEXT_PUBLIC_HTTP_NOSTR_GATEWAY || 'https://njump.me'}/${activity.naddr}`
    const pubDate = activity.ends
      ? new Date(activity.ends * 1000).toUTCString()
      : new Date((activity.created_at || 0) * 1000).toUTCString()
    const guid = activity.id

    // Use recording URL as the media URL
    const mediaUrl = activity.recordingUrl
    const mimeType = getMimeType(mediaUrl)

    // Build description from summary and content
    const description = this.buildLiveActivityDescription(activity)

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(description, { async: false }) as string)

    return `
    <item>
      <title>${this.escapeXml(title)}</title>
      <link>${link}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${htmlContent}]]></description>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mimeType}" length="0" />
      <media:content url="${this.escapeXml(mediaUrl)}" type="${mimeType}" />
      <itunes:title>${this.escapeXml(title)}</itunes:title>
      <itunes:author>${this.escapeXml(activity.pubkey)}</itunes:author>
      <itunes:summary><![CDATA[${htmlContent}]]></itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      ${activity.image ? `<itunes:image href="${this.escapeXml(activity.image)}"/>` : ''}
      ${valueTag || ''}
    </item>`
  }

  /**
   * Generates RSS liveItem for a Live Activity with streaming URL (live or planned activities)
   */
  private buildLiveStreamItem(activity: LiveActivity, valueTag?: string): string {
    // Only include live activities that have streaming URLs and are not ended
    if (!activity.streamingUrl || activity.status === 'ended') return ''

    const title = activity.title || ''
    const link = `${process.env.NEXT_PUBLIC_HTTP_NOSTR_GATEWAY || 'https://njump.me'}/${activity.naddr}`
    const guid = activity.id
    const streamUrl = activity.streamingUrl
    const mimeType = streamUrl ? getMimeType(streamUrl) : 'application/x-mpegURL'

    // Build description
    const description = this.buildLiveActivityDescription(activity)

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(description, { async: false }) as string)

    // Format start and end times
    const startTime = activity.starts ? new Date(activity.starts * 1000).toISOString() : new Date((activity.created_at || 0) * 1000).toISOString()
    const endTime = activity.ends ? new Date(activity.ends * 1000).toISOString() : undefined

    return `
    <podcast:liveItem status="${activity.status || 'live'}" start="${startTime || ''}"${endTime ? ` end="${endTime}"` : ''}>
      <title>${this.escapeXml(title)}</title>
      <link>${link}</link>
      <guid>${guid}</guid>
      <description><![CDATA[${htmlContent}]]></description>
      <enclosure url="${this.escapeXml(streamUrl)}" type="${mimeType}" length="0" />
      <media:content url="${this.escapeXml(streamUrl)}" type="${mimeType}" />
      <itunes:title>${this.escapeXml(title)}</itunes:title>
      <itunes:author>${this.escapeXml(activity.pubkey)}</itunes:author>
      <itunes:summary><![CDATA[${htmlContent}]]></itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      ${activity.image ? `<itunes:image href="${this.escapeXml(activity.image)}"/>` : ''}
      ${valueTag || ''}
    </podcast:liveItem>`
  }

  /**
   * Synchronous version
   */
  private generateLiveActivityItem(event: NDKEvent): string {
    const activity = this.nostrService?.transformToLiveActivity(event)

    if (activity?.recordingUrl) {
      return this.buildLiveRecordingItem(activity)
    } else if (activity?.streamingUrl) {
      return this.buildLiveStreamItem(activity)
    }

    return ''
  }

  /**
   * Async version
   */
  private async generateLiveActivityItemAsync(event: NDKEvent): Promise<string> {
    const activity = this.nostrService?.transformToLiveActivity(event)
    if (!activity) return ''

    // Populate participant profiles for live activities
    if (activity.participants && activity.participants.length > 0) {
      activity.participants = await this.nostrService?.populateLiveActivityParticipants(activity.participants)
    }

    const valueSplits = await this.generateValueSplitsForLiveActivity(activity)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    if (activity.recordingUrl) {
      return this.buildLiveRecordingItem(activity, valueTag)
    } else if (activity.streamingUrl) {
      return this.buildLiveStreamItem(activity, valueTag)
    }

    return ''
  }

  /**
   * Helper method to build description for live activities
   */
  private buildLiveActivityDescription(activity: LiveActivity): string {
    let description = ''
    if (activity.summary) {
      description += activity.summary
    }
    if (activity.content) {
      description += (description ? '\n\n' : '') + activity.content
    }
    if (!description) {
      description = activity.status === 'ended' ? 'Live activity recording' : 'Live activity'
    }

    // Add participants information to description
    if (activity.participants && activity.participants.length > 0) {
      const participantNames = activity.participants
        .filter(p => p.profile?.name)
        .map(p => `${p.profile!.name}${p.role ? ` (${p.role})` : ''}`)

      if (participantNames.length > 0) {
        description += `\n\nParticipants: ${participantNames.join(', ')}`
      }
    }

    // Add hashtags if available
    if (activity.hashtags && activity.hashtags.length > 0) {
      description += `\n\nTags: ${activity.hashtags.map(tag => `#${tag}`).join(', ')}`
    }

    return description
  }

  /**
   * Generates value splits for a live activity based on participants' lightning addresses
   * If no participants exist, falls back to using the activity creator's pubkey
   */
  private async generateValueSplitsForLiveActivity(activity: LiveActivity): Promise<ValueSplit[]> {
    if (!this.nostrService) return []

    // Try participants first if they exist
    if (activity.participants?.length) {
      const uniquePubkeys = Array.from(new Set(activity.participants.map(p => p.pubkey)))
      const participantInfo = await this.nostrService.fetchLightningAddressesWithNames(uniquePubkeys)

      const participantsWithLightning = activity.participants.filter(p =>
        participantInfo.get(p.pubkey)?.lightningAddress
      )

      if (participantsWithLightning.length > 0) {
        const basePercentage = Math.floor(100 / participantsWithLightning.length)
        const remainder = 100 - (basePercentage * participantsWithLightning.length)

        return participantsWithLightning.map((participant, index) => {
          const info = participantInfo.get(participant.pubkey)!
          return {
            pubkey: participant.pubkey,
            percentage: basePercentage + (index === 0 ? remainder : 0),
            lightningAddress: info.lightningAddress!,
            name: participant.profile?.name || info.name || participant.role || `Participant ${participant.pubkey.substring(0, 8)}`
          }
        })
      }
    }

    // Fallback to activity creator
    const creatorInfo = await this.nostrService.fetchLightningAddressesWithNames([activity.pubkey])
    const creatorData = creatorInfo.get(activity.pubkey)

    return creatorData?.lightningAddress ? [{
      pubkey: activity.pubkey,
      percentage: 100,
      lightningAddress: creatorData.lightningAddress,
      name: creatorData.name || `Creator ${activity.pubkey.substring(0, 8)}`
    }] : []
  }
}