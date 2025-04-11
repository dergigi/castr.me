import NDK from '@nostr-dev-kit/ndk'
import { decode } from 'nostr-tools/nip19'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { AudioEvent } from "../../types";

export interface NostrProfile {
  name?: string
  about?: string
  picture?: string
  nip05?: string
  lud16?: string
  lud06?: string
}

export class NostrService {
  private ndk: NDK
  private defaultRelay = 'wss://relay.nostr.band'
  private defaultNpub = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n'

  constructor() {
    this.ndk = new NDK({
      explicitRelayUrls: [this.defaultRelay],
    })
  }

  async initialize(): Promise<void> {
    await this.ndk.connect();
  }

  private getPubkeyFromNpub(npub: string): string | null {
    try {
      if (!npub.startsWith('npub1')) {
        return npub // Assume it's already a pubkey
      }
      
      const decoded = decode(npub)
      if (decoded.type !== 'npub') {
        console.error('Invalid npub format')
        return null
      }
      
      return decoded.data as string
    } catch (error) {
      console.error('Error decoding npub:', error)
      return null
    }
  }

  async getUserProfile(npub: string): Promise<NostrProfile | null> {
    try {
      const pubkey = this.getPubkeyFromNpub(npub)
      if (!pubkey) return null

      const user = await this.ndk.getUser({ pubkey })
      if (!user) return null

      const profile = await user.fetchProfile()
      return profile || null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  async getAudioEvents(npub: string): Promise<NDKEvent[]> {
    try {
      const pubkey = this.getPubkeyFromNpub(npub)
      if (!pubkey) return []

      const user = await this.ndk.getUser({ pubkey })
      if (!user) return []

      const events = await this.ndk.fetchEvents({
        kinds: [1],
        authors: [pubkey],
      })

      return Array.from(events)
    } catch (error) {
      console.error('Error fetching audio events:', error)
      return []
    }
  }

  private isAudioEvent(event: NDKEvent): boolean {
    const content = event.content;
    return (
      content.includes('.mp3') ||
      content.includes('.m4a') ||
      content.includes('.wav') ||
      content.includes('.ogg')
    );
  }

  protected transformToAudioEvent(event: NDKEvent): AudioEvent {
    const audioUrl = this.extractAudioUrl(event.content);
    return {
      id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at || 0,
      content: event.content,
      tags: event.tags,
      sig: event.sig || '',
      audioUrl,
      title: this.extractTitle(event)
    };
  }

  private extractAudioUrl(content: string): string | undefined {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:mp3|m4a|wav|ogg))/i;
    const match = content.match(urlRegex);
    return match ? match[0] : undefined;
  }

  private extractTitle(event: NDKEvent): string {
    // Try to find a title tag
    const titleTag = event.tags.find(tag => tag[0] === 'title');
    if (titleTag) return titleTag[1];

    // Otherwise, use the first line of content or a truncated version
    const firstLine = event.content.split('\n')[0];
    return firstLine.length > 100 ? `${firstLine.substring(0, 97)}...` : firstLine;
  }
} 