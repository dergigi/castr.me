import NDK from '@nostr-dev-kit/ndk'
import { decode } from 'nostr-tools/nip19'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { MediaEvent } from "../../types";

export interface NostrProfile {
  name?: string
  about?: string
  picture?: string
  banner?: string
  image?: string
  nip05?: string
  lud16?: string
  lud06?: string
}

export class NostrService {
  private ndk: NDK | null = null
  private readonly defaultRelay = 'wss://relay.nostr.band'
  private readonly defaultNpub = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n'

  async initialize(): Promise<void> {
    if (!this.ndk) {
      this.ndk = new NDK({
        explicitRelayUrls: [this.defaultRelay],
      })
      await this.ndk.connect()
    }
  }

  private getPubkeyFromNpub(npub: string): string | null {
    try {
      // Ignore favicon.ico requests
      if (npub === 'favicon.ico') return null;
      
      // Remove any potential URL encoding or invalid characters
      const cleanNpub = decodeURIComponent(npub).replace(/[^a-zA-Z0-9]/g, '')
      
      // Ensure npub has the correct prefix and length
      const normalizedNpub = cleanNpub.startsWith('npub1') ? cleanNpub : `npub1${cleanNpub}`
      
      // Validate the npub format (must be exactly 63 characters: 'npub1' + 58 chars)
      if (normalizedNpub.length !== 63 || !/^npub1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(normalizedNpub)) {
        console.error('Invalid npub format:', npub)
        return null
      }

      const decoded = decode(normalizedNpub)
      if (decoded.type !== 'npub') return null
      return decoded.data
    } catch (error) {
      console.error('Error decoding npub:', error)
      return null
    }
  }

  async getUserProfile(npub: string = this.defaultNpub): Promise<NostrProfile | null> {
    try {
      const pubkey = this.getPubkeyFromNpub(npub)
      if (!pubkey) return null
      const user = await this.ndk?.getUser({ pubkey })
      if (!user) return null
      const profile = await user.fetchProfile()
      return profile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  async getMediaEvents(npub: string = this.defaultNpub): Promise<MediaEvent[]> {
    try {
      const pubkey = this.getPubkeyFromNpub(npub)
      if (!pubkey) return []
      const events = await this.ndk?.fetchEvents({
        kinds: [31990],
        authors: [pubkey],
      })
      return events ? Array.from(events).map(event => this.transformToMediaEvent(event)) : []
    } catch (error) {
      console.error('Error fetching media events:', error)
      return []
    }
  }

  async getKind1Events(npub: string = this.defaultNpub): Promise<NDKEvent[]> {
    try {
      const pubkey = this.getPubkeyFromNpub(npub)
      if (!pubkey) return []
      const events = await this.ndk?.fetchEvents({
        kinds: [1],
        authors: [pubkey],
        limit: 420,
      })
      return events ? Array.from(events) : []
    } catch (error) {
      console.error('Error fetching kind1 events:', error)
      return []
    }
  }

  /**
   * Fetches all long-form content (NIP-23) events for a user
   * @param npub The npub of the user
   * @returns An array of long-form content events
   */
  async getLongFormEvents(npub: string = this.defaultNpub): Promise<NDKEvent[]> {
    try {
      const pubkey = this.getPubkeyFromNpub(npub)
      if (!pubkey) return []
      const events = await this.ndk?.fetchEvents({
        kinds: [30023], // NIP-23 long-form content
        authors: [pubkey],
        limit: 100, // Limit to avoid too many results
      })
      return events ? Array.from(events) : []
    } catch (error) {
      console.error('Error fetching long-form events:', error)
      return []
    }
  }

  /**
   * Matches media events with their corresponding long-form content for show notes
   * @param mediaEvents Array of media events (usually kind:1 events with audio/video)
   * @param longFormEvents Array of long-form content events (kind:30023)
   * @returns A Map with media event titles as keys and matching long-form events as values
   */
  matchLongFormShowNotes(mediaEvents: NDKEvent[], longFormEvents: NDKEvent[]): Map<string, NDKEvent> {
    const longFormMap = new Map<string, NDKEvent>()
    
    for (const event of mediaEvents) {
      const kind1Title = event.content.split('\n')[0].trim()
      // First try to find a matching long-form event by title
      let matchingLongForm = longFormEvents.find(longFormEvent => {
        const longFormTitle = this.extractTitle(longFormEvent)
        return longFormTitle.toLowerCase().includes(kind1Title.toLowerCase())
      })

      // If no match found, try matching by episode number
      if (!matchingLongForm) {
        const episodeNumber = this.extractEpisodeNumber(kind1Title)
        if (episodeNumber) {
          matchingLongForm = longFormEvents.find(longFormEvent => {
            const longFormTitle = this.extractTitle(longFormEvent)
            const longFormEpisodeNumber = this.extractEpisodeNumber(longFormTitle)
            return longFormEpisodeNumber === episodeNumber
          })
        }
      }

      if (matchingLongForm) {
        longFormMap.set(kind1Title, matchingLongForm)
      }
    }
    
    return longFormMap
  }

  /**
   * Adds show notes from long-form content to media events
   * @param mediaEvents Array of media events to enhance with show notes
   * @param longFormMap Map of media event titles to their matching long-form events
   * @returns The enhanced media events with show notes added as tags
   */
  addShowNotesToEvents(mediaEvents: NDKEvent[], longFormMap: Map<string, NDKEvent>): NDKEvent[] {
    return mediaEvents.map(event => {
      const kind1Title = event.content.split('\n')[0].trim()
      const longFormEvent = longFormMap.get(kind1Title)
      
      if (longFormEvent) {
        // Add show notes tag to the event
        event.tags.push(['show_notes', longFormEvent.content])
      }
      
      return event
    })
  }

  extractTitle(event: NDKEvent): string {
    // Try to find a title tag
    const titleTag = event.tags.find(tag => tag[0] === 'title');
    if (titleTag) return titleTag[1];

    // Otherwise, use the first line of content or a truncated version
    const firstLine = event.content.split('\n')[0];
    return firstLine.length > 100 ? `${firstLine.substring(0, 97)}...` : firstLine;
  }

  extractEpisodeNumber(title: string): string | null {
    // Try different episode number formats
    const patterns = [
      /\[(\d+)\]/, // [21]
      /^(\d+):/, // 21:
      /^(\d+)\s*[-–—]\s*/, // 21 - or 21-
      /Episode\s*(\d+)\s*[-:]/i, // Episode 21: or Episode 21 -
      /E(\d+)\s*[-:]/i, // E21: or E21 -
      /#(\d+)\s*[-:]/i, // #21: or #21 -
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Finds a long-form content event that matches the title of a kind1 event
   * @param kind1Event The kind1 event to find matching long-form content for
   * @param longFormEvents Optional array of long-form events to search through
   * @returns The matching long-form content event or null if not found
   */
  async findMatchingLongFormContent(kind1Event: NDKEvent, longFormEvents?: NDKEvent[]): Promise<NDKEvent | null> {
    try {
      // Get the title from the kind1 event
      const title = this.extractTitle(kind1Event);
      
      // If longFormEvents is provided, search through them
      if (longFormEvents && longFormEvents.length > 0) {
        // First try exact title match
        for (const event of longFormEvents) {
          const eventTitle = this.extractTitle(event);
          if (eventTitle.toLowerCase().includes(title.toLowerCase())) {
            return event;
          }
        }

        // If no match found, try matching by episode number
        const episodeNumber = this.extractEpisodeNumber(title);
        if (episodeNumber) {
          for (const event of longFormEvents) {
            const eventTitle = this.extractTitle(event);
            const eventEpisodeNumber = this.extractEpisodeNumber(eventTitle);
            if (eventEpisodeNumber === episodeNumber) {
              return event;
            }
          }
        }
        return null;
      }
      
      // Otherwise, fetch long-form content events from the same author
      const pubkey = kind1Event.pubkey;
      
      // Fetch long-form content events (kind 30023) from the same author
      const events = await this.ndk?.fetchEvents({
        kinds: [30023], // NIP-23 long-form content
        authors: [pubkey],
        limit: 100, // Limit to avoid too many results
      });
      
      if (!events || events.size === 0) {
        return null;
      }
      
      // Find an event with a matching title
      const eventsArray = Array.from(events);
      for (const event of eventsArray) {
        const eventTitle = this.extractTitle(event);
        if (eventTitle.toLowerCase().includes(title.toLowerCase())) {
          return event;
        }
      }

      // If no match found, try matching by episode number
      const episodeNumber = this.extractEpisodeNumber(title);
      if (episodeNumber) {
        for (const event of eventsArray) {
          const eventTitle = this.extractTitle(event);
          const eventEpisodeNumber = this.extractEpisodeNumber(eventTitle);
          if (eventEpisodeNumber === episodeNumber) {
            return event;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding matching long-form content:', error);
      return null;
    }
  }

  isAudioEvent(event: NDKEvent): boolean {
    const content = event.content;
    return (
      content.includes('.mp3') ||
      content.includes('.m4a') ||
      content.includes('.wav') ||
      content.includes('.ogg')
    );
  }

  isMediaEvent(event: NDKEvent): boolean {
    const content = event.content;
    return (
      content.includes('.mp3') ||
      content.includes('.m4a') ||
      content.includes('.wav') ||
      content.includes('.ogg') ||
      content.includes('.mp4') ||
      content.includes('.webm') ||
      content.includes('.mov')
    );
  }

  protected transformToMediaEvent(event: NDKEvent): MediaEvent {
    const audioUrl = this.extractAudioUrl(event.content);
    const videoUrl = this.extractVideoUrl(event.content);
    const mediaType = videoUrl ? 'video' : audioUrl ? 'audio' : undefined;
    
    return {
      id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at || 0,
      content: event.content,
      tags: event.tags,
      sig: event.sig || '',
      audioUrl,
      videoUrl,
      mediaType,
      title: this.extractTitle(event)
    };
  }

  private extractAudioUrl(content: string): string | undefined {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:mp3|m4a|wav|ogg))/i;
    const match = content.match(urlRegex);
    return match ? match[0] : undefined;
  }

  private extractVideoUrl(content: string): string | undefined {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|mov))/i;
    const match = content.match(urlRegex);
    return match ? match[0] : undefined;
  }

  extractImage(event: NDKEvent): string | undefined {
    // Try to find an image tag
    const imageTag = event.tags.find(tag => tag[0] === 'image');
    if (imageTag) return imageTag[1];

    // Try to find an image URL in the content
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i;
    const match = event.content.match(imageRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Fetches an event by its ID
   * @param eventId The ID of the event to fetch
   * @returns The event or null if not found
   */
  async getEventById(eventId: string): Promise<NDKEvent | null> {
    try {
      // Handle both nevent and naddr formats
      let pubkey: string | null = null;
      let identifier: string | null = null;
      
      if (eventId.startsWith('nevent1')) {
        // For nevent format, we need to extract the event ID
        const decoded = decode(eventId);
        if (decoded.type !== 'nevent') return null;
        return await this.ndk?.fetchEvent(decoded.data.id) || null;
      } else if (eventId.startsWith('naddr1')) {
        // For naddr format, we need to extract the pubkey and identifier
        const decoded = decode(eventId);
        if (decoded.type !== 'naddr') return null;
        pubkey = decoded.data.pubkey;
        identifier = decoded.data.identifier;
        
        // Fetch events with the matching pubkey and identifier
        const events = await this.ndk?.fetchEvents({
          kinds: [30023], // NIP-23 long-form content
          authors: [pubkey],
          limit: 1,
        });
        
        if (!events || events.size === 0) return null;
        
        // Find the event with the matching identifier
        for (const event of Array.from(events)) {
          // Check if the event has a d tag with the identifier
          const dTag = event.tags.find(tag => tag[0] === 'd');
          if (dTag && dTag[1] === identifier) {
            return event;
          }
        }
        
        return null;
      } else {
        // Assume it's a raw event ID
        return await this.ndk?.fetchEvent(eventId) || null;
      }
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return null;
    }
  }
} 