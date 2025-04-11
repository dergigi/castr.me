import NDK, { NDKEvent, NDKUser, NDKFilter } from "@nostr-dev-kit/ndk";
import { AudioEvent } from "../../types";

export class NostrService {
  private ndk: NDK;
  private defaultNpub: string = "npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n";

  constructor() {
    this.ndk = new NDK({
      explicitRelayUrls: ["wss://relay.nostr.band"],
    });
  }

  async initialize() {
    await this.ndk.connect();
  }

  async getUserProfile(npub: string = this.defaultNpub) {
    try {
      const user = this.ndk.getUser({ npub });
      return await user.fetchProfile();
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async getAudioEvents(npub: string = this.defaultNpub): Promise<AudioEvent[]> {
    try {
      const user = this.ndk.getUser({ npub });
      
      const filter: NDKFilter = {
        kinds: [1],
        authors: [user.pubkey],
        since: Math.floor(Date.now() / 1000) - 420 * 24 * 60 * 60, // Last 420 days
        limit: 420
      };

      const events = await this.ndk.fetchEvents(filter);
      return Array.from(events)
        .filter(event => this.isAudioEvent(event))
        .map(event => this.transformToAudioEvent(event))
        .filter((event): event is AudioEvent => event.audioUrl !== undefined);
    } catch (error) {
      console.error("Error fetching audio events:", error);
      return [];
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

  private transformToAudioEvent(event: NDKEvent): AudioEvent {
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