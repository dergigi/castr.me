import { NostrProfile, NostrService } from '../nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { LiveActivity } from '../../types'
import { getMimeType, hasAudioContent, hasVideoContent } from '../../utils/mimeTypes'
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
}

export class PodcastFeedGenerator {
  constructor(private nostrService?: NostrService) {}

  /**
   * Generates common RSS feed metadata
   */
  private generateFeedMetadata(profile: NostrProfile, npub: string): { title: string; description: string; link: string; language: string; pubDate: string; image: string; valueTag: string } {
    const title = profile.name || npub
    const description = profile.about || 'A media feed generated from Nostr posts'
    const link = `https://castr.me/${npub}`
    const language = 'en-us'
    const pubDate = new Date().toUTCString()
    const image = profile.picture || `https://robohash.org/${npub}.png?set=set3&size=500x500`

    // Generate value tag if Lightning address exists (default fallback)
    const valueTag = profile.lud16 ? `
    <podcast:value type="lightning" method="lnaddress" suggested="0.00021">
      <podcast:valueRecipient
        name="${this.escapeXml(title)}"
        type="lnaddress"
        address="${this.escapeXml(profile.lud16)}"
        split="100"
      />
    </podcast:value>` : ''

    return { title, description, link, language, pubDate, image, valueTag }
  }

  /**
   * Generates the RSS XML structure
   */
  private generateRSSXML(metadata: ReturnType<typeof this.generateFeedMetadata>, liveItemXml: string, itemsXml: string): string {
    const { title, description, link, language, pubDate, image, valueTag } = metadata
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${this.escapeXml(title)}</title>
    <link>${this.escapeXml(link)}</link>
    <description><![CDATA[${description}]]></description>
    <language>${language}</language>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <image>
      <url>${this.escapeXml(image)}</url>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(link)}</link>
    </image>
    <itunes:image href="${this.escapeXml(image)}"/>
    <itunes:author>${this.escapeXml(metadata.title)}</itunes:author>
    <itunes:summary><![CDATA[${description}]]></itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>${valueTag}
    ${liveItemXml}
    ${itemsXml}
  </channel>
</rss>`
  }

  /**
   * Processes and generates RSS items for media events and live activities (sync version)
   */
  private processItems(events: NDKEvent[], liveActivities?: LiveActivity[], longFormMap?: Map<string, NDKEvent>): { liveItemXml: string; itemsXml: string } {
    // Filter for media events and sort by date
    const mediaEvents = this.filterMediaEvents(events)
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))

    // Generate items XML for media events
    const mediaItems = mediaEvents.map(event => this.generateItem(event, longFormMap))

    // Generate items for live activities - separate streaming vs recording
    let recordings: string[] = []
    let streams: string[] = []

    if (liveActivities) {
      // Items for ended activities with recordings
      recordings = liveActivities.map(activity => this.generateLiveRecordingItem(activity))

      // streams for live/planned activities with streaming URLs
      streams = liveActivities.map(activity => this.generateLiveStreamingItem(activity))
    }

    // Add streams before regular items
    const liveItemFiltered = streams.filter(item => item.trim() !== '')
    const liveItemXml = liveItemFiltered.length > 0 ? liveItemFiltered.join('\n') + '\n' : ''

    // Combine regular items and filter out empty ones
    const allItems = [...mediaItems, ...recordings].filter(item => item.trim() !== '')
    const itemsXml = allItems.join('\n')

    return { liveItemXml, itemsXml }
  }

  /**
   * Processes and generates RSS items for media events and live activities (async version)
   */
  private async processItemsAsync(events: NDKEvent[], liveActivities?: LiveActivity[], longFormMap?: Map<string, NDKEvent>, profile?: NostrProfile, npub?: string): Promise<{ liveItemXml: string; itemsXml: string }> {
    // Filter for media events and sort by date
    const mediaEvents = this.filterMediaEvents(events)
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))

    // Generate items XML for media events (with async recipient fetching)
    const mediaItemsPromises = mediaEvents.map(event => this.generateItemAsync(event, longFormMap, profile, npub))
    const mediaItems = await Promise.all(mediaItemsPromises)

    // Generate items for live activities - separate streaming vs recording
    let recordings: string[] = []
    let streams: string[] = []

    if (liveActivities) {
      // Items for ended activities with recordings (async to fetch participant profiles)
      const recordingsPromises = liveActivities.map(activity => this.generateLiveRecordingItemAsync(activity))
      recordings = await Promise.all(recordingsPromises)

      // streams for live/planned activities with streaming URLs (async to fetch participant profiles)
      const streamsPromises = liveActivities.map(activity => this.generateLiveStreamingItemAsync(activity))
      streams = await Promise.all(streamsPromises)
    }

    // Add streams before regular items
    const liveItemFiltered = streams.filter(item => item.trim() !== '')
    const liveItemXml = liveItemFiltered.length > 0 ? liveItemFiltered.join('\n') + '\n' : ''

    // Combine regular items and filter out empty ones
    const allItems = [...mediaItems, ...recordings].filter(item => item.trim() !== '')
    const itemsXml = allItems.join('\n')

    return { liveItemXml, itemsXml }
  }

  generateFeed(profile: NostrProfile, events: NDKEvent[], npub: string, longFormMap?: Map<string, NDKEvent>, liveActivities?: LiveActivity[]): string {
    const metadata = this.generateFeedMetadata(profile, npub)
    const { liveItemXml, itemsXml } = this.processItems(events, liveActivities, longFormMap)
    return this.generateRSSXML(metadata, liveItemXml, itemsXml)
  }

  /**
   * Async version of generateFeed that fetches recipient information
   */
  async generateFeedAsync(profile: NostrProfile, events: NDKEvent[], npub: string, longFormMap?: Map<string, NDKEvent>, liveActivities?: LiveActivity[]): Promise<string> {
    const metadata = this.generateFeedMetadata(profile, npub)
    const { liveItemXml, itemsXml } = await this.processItemsAsync(events, liveActivities, longFormMap, profile, npub)
    return this.generateRSSXML(metadata, liveItemXml, itemsXml)
  }

  private filterMediaEvents(events: NDKEvent[]): NDKEvent[] {
    return events.filter(event => this.isMediaEvent(event))
  }

  private isMediaEvent(event: NDKEvent): boolean {
    return hasAudioContent(event.content) || hasVideoContent(event.content)
  }
  
  private generateItem(event: NDKEvent, longFormMap?: Map<string, NDKEvent>): string {
    const audioUrl = this.extractAudioUrl(event.content)
    const videoUrl = this.extractVideoUrl(event.content)
    if (!audioUrl && !videoUrl) return ''
    
    const title = this.extractTitle(event)
    const pubDate = new Date((event.created_at || 0) * 1000).toUTCString()
    const guid = event.id
    // const mediaType = videoUrl ? 'video' : 'audio'
    const mediaUrl = videoUrl || audioUrl || ''
    
    // Extract show notes from long-form content if available
    const showNotes = this.extractShowNotes(event)
    const content = showNotes || event.content
    
    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(content, { async: false }) as string)
    
    // Generate value splits for this item (synchronous version for now)
    const valueSplits = this.generateValueSplitsForEventSync(event, longFormMap)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    const mimeType = this.getMediaMimeType(mediaUrl)

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
    
    const recipients = splits.map(split => {
      const name = split.name || `Recipient ${split.pubkey.substring(0, 8)}`
      const address = split.lightningAddress || `recipient@${split.pubkey.substring(0, 8)}.ln`
      
      return `        <podcast:valueRecipient 
          name="${this.escapeXml(name)}"
          type="lnaddress"
          address="${this.escapeXml(address)}"
          split="${split.percentage}"
        />`
    }).join('\n')
    
    return `
      <podcast:value type="lightning" method="lnaddress" suggested="0.00021">
${recipients}
      </podcast:value>`
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

  private escapeXml(unsafe: string | undefined | null): string {
    if (unsafe == null) {
      return ''
    }
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
   * Generates RSS item for a Live Activity with recording (ended activities)
   */
  private generateLiveRecordingItem(activity: LiveActivity): string {
    // Only include live activities that have recording URLs
    if (!activity.recordingUrl) return ''

    const title = activity.title || ''
    const pubDate = activity.ends
      ? new Date(activity.ends * 1000).toUTCString()
      : new Date((activity.created_at || 0) * 1000).toUTCString()
    const guid = activity.id

    // Use recording URL as the media URL
    const mediaUrl = activity.recordingUrl

    // Build description from summary and content
    const description = this.buildLiveActivityDescription(activity)

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(description, { async: false }) as string)

    const mimeType = this.getMediaMimeType(mediaUrl)

    return `
    <item>
      <title>${this.escapeXml(title)}</title>
      <description><![CDATA[${htmlContent}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mimeType}" length="0"/>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:subtitle>${this.escapeXml(activity.summary || title)}</itunes:subtitle>
      ${activity.image ? `<itunes:image href="${this.escapeXml(activity.image)}"/>` : ''}
    </item>`
  }

  /**
   * Generates RSS liveItem for a Live Activity with streaming URL (live or planned activities)
   */
  private generateLiveStreamingItem(activity: LiveActivity): string {
    // Only include live activities that have streaming URLs and are not ended
    if (!activity.streamingUrl || activity.status === 'ended') return ''

    const title = activity.title || ''
    const guid = activity.id
    const streamUrl = activity.streamingUrl

    // Build description
    const description = this.buildLiveActivityDescription(activity)

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(description, { async: false }) as string)

    // Format start and end times
    const startTime = activity.starts ? new Date(activity.starts * 1000).toISOString() : new Date((activity.created_at || 0) * 1000).toISOString()
    const endTime = activity.ends ? new Date(activity.ends * 1000).toISOString() : undefined

    // Build liveItem XML
    let liveItemXml = `
    <podcast:liveItem status="${activity.status || 'live'}" start="${startTime || ''}"${endTime ? ` end="${endTime}"` : ''}>
      <title>${this.escapeXml(title)}</title>
      <description><![CDATA[${htmlContent}]]></description>
      <guid isPermaLink="false">${guid}</guid>
      <enclosure url="${this.escapeXml(streamUrl)}" type="${this.getStreamMimeType(streamUrl)}" length="0"/>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:subtitle>${this.escapeXml(activity.summary || title)}</itunes:subtitle>
      ${activity.image ? `<itunes:image href="${this.escapeXml(activity.image)}"/>` : ''}`

    // Add participants as podcast:person tags if available
    if (activity.participants && activity.participants.length > 0) {
      for (const participant of activity.participants) {
        if (participant.profile?.name) {
          const role = participant.role?.toLowerCase() || 'participant'
          liveItemXml += `
      <podcast:person role="${role}" href="${participant.profile.picture || ''}">${this.escapeXml(participant.profile.name)}</podcast:person>`
        }
      }
    }

    liveItemXml += `
    </podcast:liveItem>`

    return liveItemXml
  }

  /**
   * Determines the MIME type for a streaming URL
   */
  private getStreamMimeType(url: string): string {
    if (!url) return 'application/x-mpegURL' // Default to HLS
    return getMimeType(url)
  }

  /**
   * Determines the MIME type for any media URL (recording or regular media)
   */
  private getMediaMimeType(url: string): string {
    return getMimeType(url)
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
   * Async version of generateItem that fetches recipient information
   */
  private async generateItemAsync(event: NDKEvent, longFormMap?: Map<string, NDKEvent>, profile?: NostrProfile, npub?: string): Promise<string> {
    const audioUrl = this.extractAudioUrl(event.content)
    const videoUrl = this.extractVideoUrl(event.content)
    if (!audioUrl && !videoUrl) return ''
    
    const title = this.extractTitle(event)
    const pubDate = new Date((event.created_at || 0) * 1000).toUTCString()
    const guid = event.id
    // const mediaType = videoUrl ? 'video' : 'audio'
    const mediaUrl = videoUrl || audioUrl || ''
    
    // Extract show notes from long-form content if available
    const showNotes = this.extractShowNotes(event)
    const content = showNotes || event.content
    
    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(content, { async: false }) as string)
    
    // Generate value splits for this item with recipient information
    const valueSplits = await this.generateValueSplitsForEventAsync(event, longFormMap, profile, npub)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    const mimeType = this.getMediaMimeType(mediaUrl)

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
    
    // Priority 3: Use profile's lightning address as default (100% to profile owner)
    if (profile && profile.lud16 && npub) {
      return [{
        pubkey: npub,
        percentage: 100,
        lightningAddress: profile.lud16,
        name: profile.name || npub
      }]
    }
    
    // Priority 4: Return empty array (will fall back to channel-level default)
    return []
  }

  /**
   * Generates value splits for a live activity based on participants' lightning addresses
   * If no participants exist, falls back to using the activity creator's pubkey
   */
  private async generateValueSplitsForLiveActivity(activity: LiveActivity): Promise<ValueSplit[]> {
    if (!this.nostrService) {
      return []
    }

    // If we have participants, try to use them first
    if (activity.participants && activity.participants.length > 0) {
      // Extract unique pubkeys from participants
      const participantPubkeys = Array.from(new Set(activity.participants.map(p => p.pubkey)))

      // Fetch lightning addresses and names for all participants
      const participantInfo = await this.nostrService.fetchLightningAddressesWithNames(participantPubkeys)

      // Only include participants that have lightning addresses
      const participantsWithLightning = activity.participants.filter(p => {
        const info = participantInfo.get(p.pubkey)
        return info && info.lightningAddress
      })

      if (participantsWithLightning.length > 0) {
        // Calculate equal splits for all participants with lightning addresses
        const percentage = Math.floor(100 / participantsWithLightning.length)
        const remainder = 100 - (percentage * participantsWithLightning.length)

        const valueSplits: ValueSplit[] = participantsWithLightning.map((participant, index) => {
          // Give any remainder to the first participant (usually the host)
          const split = percentage + (index === 0 ? remainder : 0)
          const info = participantInfo.get(participant.pubkey)!

          return {
            pubkey: participant.pubkey,
            percentage: split,
            lightningAddress: info.lightningAddress!,
            name: participant.profile?.name || info.name || participant.role || `Participant ${participant.pubkey.substring(0, 8)}`
          }
        })

        return valueSplits
      }
    }

    // Fallback: No participants with lightning addresses (or no participants at all)
    // Use the activity creator's pubkey
    const creatorInfo = await this.nostrService.fetchLightningAddressesWithNames([activity.pubkey])
    const creatorData = creatorInfo.get(activity.pubkey)

    if (creatorData && creatorData.lightningAddress) {
      return [{
        pubkey: activity.pubkey,
        percentage: 100,
        lightningAddress: creatorData.lightningAddress,
        name: creatorData.name || `Creator ${activity.pubkey.substring(0, 8)}`
      }]
    }

    // If creator doesn't have lightning address either, return empty array
    return []
  }

  /**
   * Async version of generateLiveRecordingItem that includes value tags
   */
  private async generateLiveRecordingItemAsync(activity: LiveActivity): Promise<string> {
    // Only include live activities that have recording URLs
    if (!activity.recordingUrl) return ''

    const title = activity.title || ''
    const pubDate = activity.ends
      ? new Date(activity.ends * 1000).toUTCString()
      : new Date((activity.created_at || 0) * 1000).toUTCString()
    const guid = activity.id

    // Use recording URL as the media URL
    const mediaUrl = activity.recordingUrl

    // Build description from summary and content
    const description = this.buildLiveActivityDescription(activity)

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(description, { async: false }) as string)

    // Generate value splits for participants
    const valueSplits = await this.generateValueSplitsForLiveActivity(activity)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    const mimeType = this.getMediaMimeType(mediaUrl)

    return `
    <item>
      <title>${this.escapeXml(title)}</title>
      <description><![CDATA[${htmlContent}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
      <enclosure url="${this.escapeXml(mediaUrl)}" type="${mimeType}" length="0"/>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:subtitle>${this.escapeXml(activity.summary || title)}</itunes:subtitle>
      ${activity.image ? `<itunes:image href="${this.escapeXml(activity.image)}"/>` : ''}${valueTag}
    </item>`
  }

  /**
   * Async version of generateStreamingItem that includes value tags
   */
  private async generateLiveStreamingItemAsync(activity: LiveActivity): Promise<string> {
    // Only include live activities that have streaming URLs and are not ended
    if (!activity.streamingUrl || activity.status === 'ended') return ''

    const title = activity.title || ''
    const guid = activity.id
    const streamUrl = activity.streamingUrl

    // Build description
    const description = this.buildLiveActivityDescription(activity)

    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(description, { async: false }) as string)

    // Format start and end times
    const startTime = activity.starts ? new Date(activity.starts * 1000).toISOString() : new Date((activity.created_at || 0) * 1000).toISOString()
    const endTime = activity.ends ? new Date(activity.ends * 1000).toISOString() : undefined

    // Generate value splits for participants
    const valueSplits = await this.generateValueSplitsForLiveActivity(activity)
    const valueTag = valueSplits.length > 0 ? this.generateValueTag(valueSplits) : ''

    // Build liveItem XML
    let liveItemXml = `
    <podcast:liveItem status="${activity.status || 'live'}" start="${startTime || ''}"${endTime ? ` end="${endTime}"` : ''}>
      <title>${this.escapeXml(title)}</title>
      <description><![CDATA[${htmlContent}]]></description>
      <guid isPermaLink="false">${guid}</guid>
      <enclosure url="${this.escapeXml(streamUrl)}" type="${this.getStreamMimeType(streamUrl)}" length="0"/>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:subtitle>${this.escapeXml(activity.summary || title)}</itunes:subtitle>
      ${activity.image ? `<itunes:image href="${this.escapeXml(activity.image)}"/>` : ''}`

    // Add participants as podcast:person tags if available
    if (activity.participants && activity.participants.length > 0) {
      for (const participant of activity.participants) {
        if (participant.profile?.name) {
          const role = participant.role?.toLowerCase() || 'participant'
          liveItemXml += `
      <podcast:person role="${role}" href="${participant.profile.picture || ''}">${this.escapeXml(participant.profile.name)}</podcast:person>`
        }
      }
    }

    // Add value tag before closing
    liveItemXml += valueTag

    liveItemXml += `
    </podcast:liveItem>`

    return liveItemXml
  }
}