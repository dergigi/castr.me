import NDK from '@nostr-dev-kit/ndk'
import { NDKEvent, NDKCacheAdapter, NDKSubscription, NDKFilter, NDKRelay, NDKEventId } from '@nostr-dev-kit/ndk'
import { decode, naddrEncode } from 'nostr-tools/nip19'
import type { MediaEvent, LiveActivity, LiveActivityParticipant } from "../../types";

// NIP-53 Live Activity kind (not yet in NDK types)
const LIVE_ACTIVITY_KIND = 30311 as number;

export interface NostrProfile {
  name?: string
  about?: string
  picture?: string
  banner?: string
  image?: string
  nip05?: string
  lud16?: string
  lud06?: string
  nodeid?: string
}

/**
 * Simple in-memory cache adapter for server-side use
 * Prevents NDK from trying to use localStorage during SSR
 */
class InMemoryCacheAdapter implements NDKCacheAdapter {
  locking = false
  ready = true
  private cache = new Map<string, NDKEvent[]>()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  query(_subscription: NDKSubscription): NDKEvent[] {
    // Return empty array - we'll rely on relay queries
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setEvent(event: NDKEvent, _filters: NDKFilter[], _relay?: NDKRelay): Promise<void> {
    // Simple in-memory caching - could be enhanced if needed
    const key = event.id
    if (!this.cache.has(key)) {
      this.cache.set(key, [event])
    }
  }

  async deleteEventIds(eventIds: NDKEventId[]): Promise<void> {
    for (const eventId of eventIds) {
      this.cache.delete(eventId)
    }
  }
}

export class NostrService {
  private ndk: NDK | null = null
  private readonly defaultRelaysRaw = [
    'wss://relay.nostr.band',
    'wss://wot.dergigi.com/',
    'wss://wot.utxo.one',
    'wss://relay.damus.io'
  ]
  private readonly defaultRelays = Array.from(new Set(this.defaultRelaysRaw.map(url => url.replace(/\/$/, ''))))
  private readonly defaultIdentifier = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n'

  async initialize(): Promise<void> {
    if (!this.ndk) {
      // Use in-memory cache adapter to avoid localStorage issues during SSR
      const isServer = typeof window === 'undefined'
      const cacheAdapter = isServer ? new InMemoryCacheAdapter() : undefined

      // Provide a minimal localStorage shim on the server to satisfy libraries that expect it
      if (isServer) {
        interface GlobalWithStorage extends Omit<typeof globalThis, 'localStorage'> {
          localStorage?: Storage
        }
        const g = globalThis as GlobalWithStorage
        const needsShim = !g.localStorage || typeof g.localStorage.getItem !== 'function'
        if (needsShim) {
          const store = new Map<string, string>()
          g.localStorage = {
            getItem(key: string): string | null { return store.has(key) ? store.get(key)! : null },
            setItem(key: string, value: string): void { store.set(key, String(value)) },
            removeItem(key: string): void { store.delete(key) },
            clear(): void { store.clear() },
            key(index: number): string | null { return Array.from(store.keys())[index] ?? null },
            get length(): number { return store.size },
          }
        }
      }
      
      this.ndk = new NDK({
        explicitRelayUrls: this.defaultRelays,
        cacheAdapter,
      })
      await this.ndk.connect()
    }
  }

  /**
   * Extracts pubkey from npub or nprofile identifier following NDK best practices
   * @param identifier npub or nprofile string (may be URL-encoded)
   * @returns hex pubkey or null if invalid
   */
  private getPubkeyFromIdentifier(identifier: string): string | null {
    const data = this.getIdentifierData(identifier)
    return data?.pubkey || null
  }

  /**
   * Extracts pubkey and optional relay hints from npub or nprofile identifier
   * @param identifier npub or nprofile string (may be URL-encoded)
   * @returns Object with pubkey and optional relays array, or null if invalid
   */
  private getIdentifierData(identifier: string): { pubkey: string; relays?: string[] } | null {
    try {
      // Ignore favicon.ico requests
      if (identifier === 'favicon.ico') return null;
      
      // Decode URL encoding first (Next.js may URL-encode the path parameter)
      let decodedIdentifier: string;
      try {
        decodedIdentifier = decodeURIComponent(identifier);
      } catch {
        // If it's not URL-encoded, use as-is
        decodedIdentifier = identifier;
      }
      
      const decoded = decode(decodedIdentifier.trim());
      
      switch (decoded.type) {
        case 'npub':
          return { pubkey: decoded.data };
        case 'nprofile':
          return { 
            pubkey: decoded.data.pubkey,
            relays: decoded.data.relays // Extract relay hints from nprofile
          };
        default:
          return null;
      }
    } catch (error) {
      console.error('Error decoding identifier:', error)
      return null
    }
  }

  /**
   * Fetches user profile from npub or nprofile identifier
   * @param identifier npub, nprofile, hex pubkey, or NIP-05 identifier
   * @returns User profile or null if not found
   */
  async getUserProfile(identifier: string = this.defaultIdentifier): Promise<NostrProfile | null> {
    try {
      // Extract pubkey from identifier (handles npub, nprofile, or use hex/NIP-05 directly)
      const pubkey = this.getPubkeyFromIdentifier(identifier) || identifier
      if (!pubkey) return null
      const user = this.ndk?.getUser({ pubkey })
      if (!user) return null
      const profile = await user.fetchProfile()
      return profile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  async getMediaEvents(identifier: string = this.defaultIdentifier): Promise<MediaEvent[]> {
    try {
      const data = this.getIdentifierData(identifier)
      if (!data) return []
      const { pubkey, relays } = data
      // Combine relay hints with default relays for better coverage
      const relayUrls = relays?.length 
        ? Array.from(new Set([...relays, ...this.defaultRelays]))
        : this.defaultRelays
      const events = await this.ndk?.fetchEvents(
        {
          kinds: [31990],
          authors: [pubkey] as string[],
        },
        relayUrls ? { relayUrls } : undefined
      )
      return events ? Array.from(events).map(event => this.transformToMediaEvent(event)) : []
    } catch (error) {
      console.error('Error fetching media events:', error)
      return []
    }
  }

  async getKind1Events(identifier: string = this.defaultIdentifier): Promise<NDKEvent[]> {
    try {
      const data = this.getIdentifierData(identifier)
      if (!data) return []
      const { pubkey, relays } = data
      // Combine relay hints with default relays for better coverage
      const relayUrls = relays?.length 
        ? Array.from(new Set([...relays, ...this.defaultRelays]))
        : this.defaultRelays
      const events = await this.ndk?.fetchEvents(
        {
          kinds: [1],
          authors: [pubkey] as string[],
          limit: 420,
        },
        relayUrls ? { relayUrls } : undefined
      )
      return events ? Array.from(events) : []
    } catch (error) {
      console.error('Error fetching kind1 events:', error)
      return []
    }
  }

  /**
   * Fetches all long-form content (NIP-23) events for a user
   * @param identifier npub or nprofile identifier of the user
   * @returns An array of long-form content events
   */
  async getLongFormEvents(identifier: string = this.defaultIdentifier): Promise<NDKEvent[]> {
    try {
      const data = this.getIdentifierData(identifier)
      if (!data) return []
      const { pubkey, relays } = data
      // Combine relay hints with default relays for better coverage
      const relayUrls = relays?.length 
        ? Array.from(new Set([...relays, ...this.defaultRelays]))
        : this.defaultRelays
      const events = await this.ndk?.fetchEvents(
        {
          kinds: [30023], // NIP-23 long-form content
          authors: [pubkey] as string[],
          limit: 100, // Limit to avoid too many results
        },
        relayUrls ? { relayUrls } : undefined
      )
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
        authors: [pubkey] as string[],
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
          authors: [pubkey] as string[],
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

  /**
   * Extracts pubkeys from zap tags in an event
   * @param event The event to extract zap tags from
   * @returns An array of pubkeys from zap tags
   */
  extractZapPubkeysFromEvent(event: NDKEvent): string[] {
    // Zap tags typically have the format ['zap', pubkey, ...]
    const zapTags = event.tags.filter(tag => tag[0] === 'zap' && tag.length > 1);
    const pubkeys = zapTags.map(tag => tag[1]);
    
    // Remove duplicates
    return Array.from(new Set(pubkeys));
  }
  
  /**
   * Fetches user profiles for pubkeys from zap tags
   * @param event The event containing zap tags
   * @returns A map of pubkeys to user profiles
   */
  async fetchZapProfiles(event: NDKEvent): Promise<Map<string, NostrProfile>> {
    try {
      const pubkeys = this.extractZapPubkeysFromEvent(event);
      const profileMap = new Map<string, NostrProfile>();
      
      for (const pubkey of pubkeys) {
        if (this.ndk) {
          const user = this.ndk.getUser({ pubkey });
          const profile = await user.fetchProfile();
          if (profile) {
            profileMap.set(pubkey, profile);
          }
        }
      }
      
      return profileMap;
    } catch (error) {
      console.error('Error fetching zap profiles:', error);
      return new Map();
    }
  }

  /**
   * Extracts zap splits from an event according to NIP-57 specification
   * @param event The event containing zap tags
   * @returns Array of zap split information with pubkeys and weights
   */
  extractZapSplitsFromEvent(event: NDKEvent): Array<{ pubkey: string; weight: number }> {
    const zapTags = event.tags.filter(tag => tag[0] === 'zap' && tag.length >= 2);
    const splits: Array<{ pubkey: string; weight: number }> = [];
    
    for (const tag of zapTags) {
      const pubkey = tag[1];
      const weight = tag.length >= 4 ? parseFloat(tag[3]) : 1; // Default weight is 1 if not specified
      
      if (!isNaN(weight) && weight > 0) {
        splits.push({ pubkey, weight });
      }
    }
    
    return splits;
  }

  /**
   * Extracts value split information from zap tags in an event
   * @param event The event containing zap tags
   * @returns A map of pubkeys to their percentage of the value split
   */
  extractValueSplitFromEvent(event: NDKEvent): Map<string, number> {
    const valueSplitMap = new Map<string, number>();
    const splits = this.extractZapSplitsFromEvent(event);
    
    if (splits.length === 0) {
      return valueSplitMap;
    }
    
    // Calculate total weight
    const totalWeight = splits.reduce((sum, split) => sum + split.weight, 0);
    
    // Calculate percentages
    if (totalWeight > 0) {
      splits.forEach(({ pubkey, weight }) => {
        const percentage = Math.round((weight / totalWeight) * 100);
        valueSplitMap.set(pubkey, percentage);
      });
    } else {
      // If no weights specified, distribute equally
      const equalPercentage = Math.round(100 / splits.length);
      splits.forEach(({ pubkey }, index) => {
        const percentage = index === splits.length - 1 
          ? 100 - (equalPercentage * (splits.length - 1)) 
          : equalPercentage;
        valueSplitMap.set(pubkey, percentage);
      });
    }
    
    return valueSplitMap;
  }

  /**
   * Extracts zap splits with percentages from an event
   * @param event The event containing zap tags
   * @returns Array of zap splits with calculated percentages
   */
  extractZapSplitsWithPercentages(event: NDKEvent): Array<{ pubkey: string; percentage: number }> {
    const splits = this.extractZapSplitsFromEvent(event);
    
    if (splits.length === 0) {
      return [];
    }
    
    // Calculate total weight
    const totalWeight = splits.reduce((sum, split) => sum + split.weight, 0);
    
    // Calculate percentages
    if (totalWeight > 0) {
      return splits.map(({ pubkey, weight }) => ({
        pubkey,
        percentage: Math.round((weight / totalWeight) * 100)
      }));
    } else {
      // If no weights specified, distribute equally
      const equalPercentage = Math.round(100 / splits.length);
      return splits.map(({ pubkey }, index) => ({
        pubkey,
        percentage: index === splits.length - 1 
          ? 100 - (equalPercentage * (splits.length - 1)) 
          : equalPercentage
      }));
    }
  }

  /**
   * Fetches zap splits with recipient information (lightning addresses and names)
   * @param event The event containing zap tags
   * @returns Array of zap splits with recipient information
   */
  async fetchZapSplitsWithRecipients(event: NDKEvent): Promise<Array<{
    pubkey: string;
    percentage: number;
    lightningAddress?: string;
    name?: string;
    nodeId?: string;
  }>> {
    const splits = this.extractZapSplitsWithPercentages(event);
    
    if (splits.length === 0) {
      return [];
    }
    
    // Fetch lightning addresses and profiles for all recipients
    const pubkeys = splits.map(split => split.pubkey);
    const lightningAddresses = await this.fetchLightningAddresses(pubkeys);
    const recipientProfiles = await this.fetchZapProfiles(event);
    
    // Combine the data
    return splits.map(split => {
      const lightningAddress = lightningAddresses.get(split.pubkey);
      const profile = recipientProfiles.get(split.pubkey);
      const name = profile?.name || `Recipient ${split.pubkey.substring(0, 8)}`;
      const nodeId = profile?.nodeid;
      
      return {
        ...split,
        lightningAddress,
        name,
        nodeId
      };
    });
  }

  /**
   * Fetches lightning addresses for a list of pubkeys
   * @param pubkeys Array of pubkeys to fetch lightning addresses for
   * @returns A map of pubkeys to their lightning addresses
   */
  async fetchLightningAddresses(pubkeys: string[]): Promise<Map<string, string>> {
    const addressMap = new Map<string, string>();
    
    try {
      for (const pubkey of pubkeys) {
        if (this.ndk) {
          const user = this.ndk.getUser({ pubkey });
          const profile = await user.fetchProfile();
          if (profile && profile.lud16) {
            addressMap.set(pubkey, profile.lud16);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lightning addresses:', error);
    }
    
    return addressMap;
  }

  /**
   * Fetches lightning addresses and names for a list of pubkeys
   * @param pubkeys Array of pubkeys to fetch information for
   * @returns A map of pubkeys to their lightning addresses and names
   */
  async fetchLightningAddressesWithNames(pubkeys: string[]): Promise<Map<string, { lightningAddress?: string; name?: string }>> {
    const infoMap = new Map<string, { lightningAddress?: string; name?: string }>();

    if (!this.ndk || pubkeys.length === 0) {
      return infoMap;
    }

    try {
      // Fetch all profile events (kind 0) for all pubkeys in a single batch query
      const events = await this.ndk.fetchEvents({
        kinds: [0], // Profile events
        authors: pubkeys,
        limit: pubkeys.length
      });

      // Process events and populate map
      events?.forEach(event => {
        let profile: NostrProfile | undefined;
        try {
          profile = JSON.parse(event.content);
        } catch (parseError) {
          console.error(`Error parsing profile for pubkey ${event.pubkey}:`, parseError);
        }

        infoMap.set(event.pubkey, {
          lightningAddress: profile?.lud16,
          name: profile?.name
        });
      });

      // Add missing pubkeys with undefined values
      pubkeys.forEach(pubkey => {
        if (!infoMap.has(pubkey)) {
          infoMap.set(pubkey, { lightningAddress: undefined, name: undefined });
        }
      });

    } catch (error) {
      console.error('Error fetching lightning addresses and names:', error);
    }

    return infoMap;
  }

  /**
   * Fetches Live Activity events (NIP-53, kind 30311) for a user
   * @param npub The npub of the user
   * @returns An array of Live Activity events
   */
  async getLiveActivityEvents(npub: string = this.defaultIdentifier): Promise<NDKEvent[]> {
    try {
      const pubkey = this.getPubkeyFromIdentifier(npub)
      if (!pubkey) return []
      const events = await this.ndk?.fetchEvents({
        kinds: [LIVE_ACTIVITY_KIND], // NIP-53 Live Activities
        authors: [pubkey],
        limit: 50,
      })
      return events ? Array.from(events) : []
    } catch (error) {
      console.error('Error fetching live activity events:', error)
      return []
    }
  }

  /**
   * Transforms an NDKEvent (kind 30311) into a LiveActivity object
   * @param event The NDKEvent to transform
   * @returns A LiveActivity object with parsed fields
   */
  transformToLiveActivity(event: NDKEvent): LiveActivity {
    const tags = event.tags;

    // Extract fields from tags
    const identifier = this.getTagValue(tags, 'd');
    const title = this.getTagValue(tags, 'title');
    const summary = this.getTagValue(tags, 'summary');
    const image = this.getTagValue(tags, 'image');
    const streamingUrl = this.getTagValue(tags, 'streaming');
    const recordingUrl = this.getTagValue(tags, 'recording');
    const status = this.getTagValue(tags, 'status') as 'planned' | 'live' | 'ended' | undefined;

    // Parse numeric fields
    const starts = this.getTagValue(tags, 'starts') ? parseInt(this.getTagValue(tags, 'starts')!) : (event.created_at || undefined);
    const ends = this.getTagValue(tags, 'ends') ? parseInt(this.getTagValue(tags, 'ends')!) : (event.created_at ? event.created_at + 7200 : undefined);
    const currentParticipants = this.getTagValue(tags, 'current_participants') ? parseInt(this.getTagValue(tags, 'current_participants')!) : undefined;
    const totalParticipants = this.getTagValue(tags, 'total_participants') ? parseInt(this.getTagValue(tags, 'total_participants')!) : undefined;

    // Extract hashtags (t tags)
    const hashtags = tags.filter(tag => tag[0] === 't' && tag.length > 1).map(tag => tag[1]);

    // Extract participants (p tags)
    const participants = this.extractLiveActivityParticipants(tags);

    // Extract relays
    const relays = tags.filter(tag => tag[0] === 'relays' && tag.length > 1).map(tag => tag[1]);

    // Create Naddr for linking
    const naddr = naddrEncode({
      identifier: identifier || '',
      pubkey: event.pubkey,
      kind: 30311,
      relays: relays || []
    })

    return {
      id: event.id,
      naddr: naddr,
      pubkey: event.pubkey,
      created_at: event.created_at || 0,
      content: event.content,
      tags: event.tags,
      sig: event.sig || '',
      identifier,
      title,
      summary,
      image,
      hashtags,
      streamingUrl,
      recordingUrl,
      starts,
      ends,
      status,
      currentParticipants,
      totalParticipants,
      participants,
      relays
    };
  }

  /**
   * Extracts participants from p tags in a Live Activity event
   * @param tags The tags array from the event
   * @returns Array of LiveActivityParticipant objects
   */
  private extractLiveActivityParticipants(tags: string[][]): LiveActivityParticipant[] {
    const participants: LiveActivityParticipant[] = [];

    // p tags have format: ['p', pubkey, relay?, role?, proof?]
    const pTags = tags.filter(tag => tag[0] === 'p' && tag.length >= 2);

    for (const tag of pTags) {
      const participant: LiveActivityParticipant = {
        pubkey: tag[1],
        relay: tag.length > 2 ? tag[2] : undefined,
        role: tag.length > 3 ? tag[3] as 'Host' | 'Speaker' | 'Participant' : undefined,
        proof: tag.length > 4 ? tag[4] : undefined
      };

      participants.push(participant);
    }

    return participants;
  }

  /**
   * Fetches profiles for Live Activity participants
   * @param participants Array of participants
   * @returns Array of participants with populated profile information
   */
  async populateLiveActivityParticipants(participants: LiveActivityParticipant[]): Promise<LiveActivityParticipant[]> {
    const populatedParticipants: LiveActivityParticipant[] = [];

    for (const participant of participants) {
      try {
        if (this.ndk) {
          const user = this.ndk.getUser({ pubkey: participant.pubkey });
          const profile = await user.fetchProfile();

          populatedParticipants.push({
            ...participant,
            profile: profile ? {
              name: profile.name,
              picture: profile.picture
            } : undefined
          });
        }
      } catch (error) {
        console.error('Error fetching participant profile:', error);
        // Add participant without profile info if fetch fails
        populatedParticipants.push(participant);
      }
    }

    return populatedParticipants;
  }

  /**
   * Helper method to get a tag value by tag name
   * @param tags The tags array
   * @param tagName The name of the tag to find
   * @returns The value of the tag or undefined
   */
  private getTagValue(tags: string[][], tagName: string): string | undefined {
    const tag = tags.find(tag => tag[0] === tagName && tag.length > 1);
    return tag ? tag[1] : undefined;
  }
}
