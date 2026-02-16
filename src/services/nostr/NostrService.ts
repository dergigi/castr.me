import { castUser, User } from 'applesauce-common/casts'
import { EventStore } from 'applesauce-core/event-store'
import { decodePointer, DecodeResult, isHex, kinds, normalizeToProfilePointer, NostrEvent, ProfileContent, relaySet } from 'applesauce-core/helpers'
import { firstValueFrom, lastValueFrom, mapEventsToTimeline, simpleTimeout } from 'applesauce-core/observable'
import { createEventLoaderForStore } from 'applesauce-loaders/loaders'
import { onlyEvents, RelayPool } from 'applesauce-relay'
import { EXTRA_RELAYS, LOOKUP_RELAYS } from '../../config/env'
import type { MediaEvent } from "../../types"

/** Extended profile content with nodeid */
export interface NostrProfile extends ProfileContent {
  nodeid?: string
}

export class NostrService {
  /** Create relay connection pool */
  private pool = new RelayPool()

  /** Create in-memory event store for holding events */
  private eventStore = new EventStore()

  /** Create event loader for the event store */
  private eventLoader = createEventLoaderForStore(this.eventStore, this.pool, {
    // Always request events from extra relays
    extraRelays: EXTRA_RELAYS,
    // Lookup relays for nprofile and nevent links
    lookupRelays: LOOKUP_RELAYS,
    // Connect to extra relays in nprofile and nevent links
    followRelayHints: true,
  })

  /** Prune the event store periodically */
  private pruneInterval = setInterval(() => {
    this.eventStore.prune()
  }, 1000 * 60 * 30) // 30 Minutes

  private readonly defaultRelays = EXTRA_RELAYS
  private readonly defaultIdentifier = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n'

  /** In-flight request deduplication maps */
  private inFlightKind1Events = new Map<string, Promise<NostrEvent[]>>()
  private inFlightLongFormEvents = new Map<string, Promise<NostrEvent[]>>()
  private inFlightMediaEvents = new Map<string, Promise<MediaEvent[]>>()
  private inFlightUserProfiles = new Map<string, Promise<NostrProfile | null>>()

  async shutdown(): Promise<void> {
    clearInterval(this.pruneInterval)

    // Clear in-flight request maps
    this.inFlightKind1Events.clear()
    this.inFlightLongFormEvents.clear()
    this.inFlightMediaEvents.clear()
    this.inFlightUserProfiles.clear()

    // Close all relay connections
    for (const [, relay] of Array.from(this.pool.relays.entries())) {
      await relay.close()
    }
  }

  /** Gets a user class for an identifier */
  getUser(identifier: string = this.defaultIdentifier): User | null {
    const pointer = normalizeToProfilePointer(identifier);
    if (!pointer) return null;
    return castUser(pointer, this.eventStore);
  }

  /**
   * Fetches user profile from npub or nprofile identifier
   * @param identifier npub, nprofile, hex pubkey, or NIP-05 identifier
   * @returns User profile or null if not found
   */
  async getUserProfile(identifier: string = this.defaultIdentifier): Promise<NostrProfile | null> {
    // Check if there's already an in-flight request for this identifier
    const existingRequest = this.inFlightUserProfiles.get(identifier);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request
    const requestPromise = (async () => {
      const pointer = normalizeToProfilePointer(identifier);
      if (!pointer) return null;

      const user = castUser(pointer, this.eventStore);

      // Return user profile with a timeout of 5 seconds
      return user.profile$.$first(5_000).catch((error) => {
        console.error('Error fetching user profile:', error)
        return null
      }) as Promise<NostrProfile | null>;
    })().finally(() => {
      // Remove from in-flight map when done
      this.inFlightUserProfiles.delete(identifier);
    });

    // Store the promise
    this.inFlightUserProfiles.set(identifier, requestPromise);
    return requestPromise;
  }

  async getMediaEvents(identifier: string = this.defaultIdentifier): Promise<MediaEvent[]> {
    // Check if there's already an in-flight request for this identifier
    const existingRequest = this.inFlightMediaEvents.get(identifier);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request
    const requestPromise = (async () => {
      const pointer = normalizeToProfilePointer(identifier);
      if(!pointer) return []

      const events = await lastValueFrom(this.pool.request(relaySet(this.defaultRelays, pointer.relays),
        {
          kinds: [31990],
          authors: [pointer.pubkey],
        },

      ).pipe(
        // ignore EOSE
        onlyEvents(),
        // Gather events into a timeline
        mapEventsToTimeline(),
        // Add a 60 second timeout for safety
        simpleTimeout(60_000)
      ));

      console.log(`[NostrService] Loaded ${events.length} media events for ${identifier.substring(0, 16)}`);
      return events.map(event => this.transformToMediaEvent(event))
    })().finally(() => {
      // Remove from in-flight map when done
      this.inFlightMediaEvents.delete(identifier);
    });

    // Store the promise
    this.inFlightMediaEvents.set(identifier, requestPromise);
    return requestPromise;
  }

  async getKind1Events(identifier: string = this.defaultIdentifier): Promise<NostrEvent[]> {
    // Check if there's already an in-flight request for this identifier
    const existingRequest = this.inFlightKind1Events.get(identifier);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request
    const requestPromise = (async () => {
      const pointer = normalizeToProfilePointer(identifier);
      if(!pointer) return []

      const events = await lastValueFrom(this.pool.request(relaySet(this.defaultRelays, pointer.relays),
        {
          kinds: [kinds.ShortTextNote],
          authors: [pointer.pubkey],
        },
      ).pipe(
        onlyEvents(),
        mapEventsToTimeline(),
        simpleTimeout(60_000))
      );

      console.log(`[NostrService] Loaded ${events.length} kind 1 events for ${identifier.substring(0, 16)}...`);
      return events
    })().finally(() => {
      // Remove from in-flight map when done
      this.inFlightKind1Events.delete(identifier);
    });

    // Store the promise
    this.inFlightKind1Events.set(identifier, requestPromise);
    return requestPromise;
  }

  /**
   * Fetches all long-form content (NIP-23) events for a user
   * @param identifier npub or nprofile identifier of the user
   * @returns An array of long-form content events
   */
  async getLongFormEvents(identifier: string = this.defaultIdentifier): Promise<NostrEvent[]> {
    // Check if there's already an in-flight request for this identifier
    const existingRequest = this.inFlightLongFormEvents.get(identifier);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request
    const requestPromise = (async () => {
      const pointer = normalizeToProfilePointer(identifier);
      if(!pointer) return []

      const events = await lastValueFrom(this.pool.request(relaySet(this.defaultRelays, pointer.relays),
        {
          kinds: [kinds.LongFormArticle],
          authors: [pointer.pubkey],
          limit: 100,
        },
      ).pipe(
        onlyEvents(),
        mapEventsToTimeline(),
        simpleTimeout(60_000))
      );

      console.log(`[NostrService] Loaded ${events.length} long-form events for ${identifier.substring(0, 16)}...`);
      return events
    })().finally(() => {
      // Remove from in-flight map when done
      this.inFlightLongFormEvents.delete(identifier);
    });

    // Store the promise
    this.inFlightLongFormEvents.set(identifier, requestPromise);
    return requestPromise;
  }

  /**
   * Matches media events with their corresponding long-form content for show notes
   * @param mediaEvents Array of media events (usually kind:1 events with audio/video)
   * @param longFormEvents Array of long-form content events (kind:30023)
   * @returns A Map with media event titles as keys and matching long-form events as values
   */
  matchLongFormShowNotes(mediaEvents: MediaEvent[], longFormEvents: NostrEvent[]): Map<string, NostrEvent> {
    const longFormMap = new Map<string, NostrEvent>()

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
  addShowNotesToEvents(mediaEvents: NostrEvent[], longFormMap: Map<string, NostrEvent>): NostrEvent[] {
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

  extractTitle(event: NostrEvent): string {
    // Try to find a title tag
    if (event.tags) {
      const titleTag = event.tags.find(tag => tag[0] === 'title');
      if (titleTag) return titleTag[1];
    }

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
  async findMatchingLongFormContent(kind1Event: NostrEvent, longFormEvents?: NostrEvent[]): Promise<NostrEvent | null> {
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
      const events = await this.getLongFormEvents(pubkey);

      if (!events || events.length === 0) {
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

  isAudioEvent(event: NostrEvent): boolean {
    const content = event.content;
    return (
      content.includes('.mp3') ||
      content.includes('.m4a') ||
      content.includes('.wav') ||
      content.includes('.ogg')
    );
  }

  isMediaEvent(event: NostrEvent): boolean {
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

  protected transformToMediaEvent(event: NostrEvent): MediaEvent {
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

  extractImage(event: NostrEvent): string | undefined {
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
  async getEventById(eventId: string): Promise<NostrEvent | null> {
    try {
      let decoded: DecodeResult;
      if (isHex(eventId)) {
        decoded = {type: 'nevent', data: {id: eventId} };
      } else {
        try {
          decoded = decodePointer(eventId);
        } catch (error) {
          console.error('Error decoding pointer:', error);
          return null;
        }
      }

      // Ensure the pointer is to an event
      if(decoded.type !== 'nevent' && decoded.type !== 'naddr' && decoded.type !== 'note') return null;

      return firstValueFrom(this.eventStore.event(decoded.data).pipe(simpleTimeout(60_000)))
        .then(v => v ?? null)
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
  extractZapPubkeysFromEvent(event: NostrEvent): string[] {
    // Zap tags typically have the format ['zap', pubkey, ...]
    const zapTags = event.tags.filter(tag => tag[0] === 'zap' && tag.length > 1);
    const pubkeys = zapTags.map(tag => tag[1]);

    // Remove duplicates
    return Array.from(new Set(pubkeys));
  }

  /** Fetches user profiles and returns a map */
  async fetchUserProfiles(pubkeys: string[]): Promise<Map<string, NostrProfile>> {
    if(pubkeys.length === 0) return new Map();

    try {
      const promises = pubkeys.map(async pubkey => [pubkey, await this.getUserProfile(pubkey)] as const)
      const profiles = new Map<string, NostrProfile>(
        (await Promise.all(promises))
        .filter(v => v[1] !== null)
        .map(v => [v[0], v[1]!] as const)
      );
      console.log(`[NostrService] Loaded ${profiles.size} profiles (requested ${pubkeys.length})`);
      return profiles;
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      return new Map();
    }
  }

  /**
   * Fetches user profiles for pubkeys from zap tags
   * @param event The event containing zap tags
   * @returns A map of pubkeys to user profiles
   */
  async fetchZapProfiles(event: NostrEvent): Promise<Map<string, NostrProfile>> {
    return this.fetchUserProfiles(this.extractZapPubkeysFromEvent(event))
  }

  /**
   * Extracts zap splits from an event according to NIP-57 specification
   * @param event The event containing zap tags
   * @returns Array of zap split information with pubkeys and weights
   */
  extractZapSplitsFromEvent(event: NostrEvent): Array<{ pubkey: string; weight: number }> {
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
  extractValueSplitFromEvent(event: NostrEvent): Map<string, number> {
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
  extractZapSplitsWithPercentages(event: NostrEvent): Array<{ pubkey: string; percentage: number }> {
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
  async fetchZapSplitsWithRecipients(event: NostrEvent): Promise<Array<{
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
    const profiles = await this.fetchUserProfiles(pubkeys)

    const addresses = new Map<string,string>()

    for (const [pubkey, profile] of Array.from(profiles.entries())) {
      if (profile.lud16) {
        addresses.set(pubkey, profile.lud16)
      }
    }

    return addresses
  }
}
