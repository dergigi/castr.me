import NDK from '@nostr-dev-kit/ndk'
import { decode } from 'nostr-tools/nip19'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { MediaEvent } from "../../types";

export interface NostrProfile {
  name?: string
  about?: string
  picture?: string
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
      // Remove any potential URL encoding or invalid characters
      const cleanNpub = decodeURIComponent(npub).replace(/[^a-zA-Z0-9]/g, '')
      
      // Ensure npub has the correct prefix
      const normalizedNpub = cleanNpub.startsWith('npub1') ? cleanNpub : `npub1${cleanNpub}`
      
      // Validate the npub format
      if (!/^npub1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(normalizedNpub)) {
        console.error('Invalid npub format:', normalizedNpub)
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

  extractTitle(event: NDKEvent): string {
    // Try to find a title tag
    const titleTag = event.tags.find(tag => tag[0] === 'title');
    if (titleTag) return titleTag[1];

    // Otherwise, use the first line of content or a truncated version
    const firstLine = event.content.split('\n')[0];
    return firstLine.length > 100 ? `${firstLine.substring(0, 97)}...` : firstLine;
  }
} 