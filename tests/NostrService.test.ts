import { NostrService } from '../src/services/nostr/NostrService';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { AudioEvent } from '../src/types';

// Create a test class that extends NostrService to access protected methods
class TestNostrService extends NostrService {
  public testTransformToAudioEvent(event: NDKEvent): AudioEvent {
    return this.transformToAudioEvent(event);
  }
}

describe('NostrService', () => {
  let nostrService: TestNostrService;

  beforeEach(() => {
    nostrService = new TestNostrService();
  });

  describe('defaultNpub', () => {
    it('should have the correct default npub', () => {
      // Access the private property using bracket notation
      const defaultNpub = (nostrService as any).defaultNpub;
      expect(defaultNpub).toBe('npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n');
    });
  });

  describe('isAudioEvent', () => {
    it('should identify events with audio file links', () => {
      const event = new NDKEvent();
      event.content = 'Check out my new podcast episode: https://example.com/episode.mp3';
      expect(nostrService['isAudioEvent'](event)).toBe(true);
    });

    it('should reject events without audio file links', () => {
      const event = new NDKEvent();
      event.content = 'Just a regular post without audio';
      expect(nostrService['isAudioEvent'](event)).toBe(false);
    });
  });

  describe('extractAudioUrl', () => {
    it('should extract audio URL from content', () => {
      const content = 'New episode: https://example.com/episode.mp3';
      const url = nostrService['extractAudioUrl'](content);
      expect(url).toBe('https://example.com/episode.mp3');
    });

    it('should return undefined for content without audio URL', () => {
      const content = 'No audio URL here';
      const url = nostrService['extractAudioUrl'](content);
      expect(url).toBeUndefined();
    });
  });

  describe('extractTitle', () => {
    it('should extract title from title tag', () => {
      const event = new NDKEvent();
      event.tags = [['title', 'Episode Title']];
      event.content = 'Some content';
      const title = nostrService['extractTitle'](event);
      expect(title).toBe('Episode Title');
    });

    it('should use first line of content as title when no title tag exists', () => {
      const event = new NDKEvent();
      event.content = 'First line\nSecond line';
      const title = nostrService['extractTitle'](event);
      expect(title).toBe('First line');
    });

    it('should truncate long titles', () => {
      const event = new NDKEvent();
      event.content = 'A'.repeat(150);
      const title = nostrService['extractTitle'](event);
      expect(title.length).toBe(100);
      expect(title.endsWith('...')).toBe(true);
    });
  });

  describe('transformToAudioEvent', () => {
    it('should transform NDKEvent to AudioEvent', () => {
      const mockNDKEvent: NDKEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'Test content with https://example.com/audio.mp3',
        tags: [['title', 'Test Title']],
        sig: 'test-sig'
      } as NDKEvent;

      const result = nostrService.testTransformToAudioEvent(mockNDKEvent);

      expect(result).toEqual({
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'Test content with https://example.com/audio.mp3',
        tags: [['title', 'Test Title']],
        sig: 'test-sig',
        audioUrl: 'https://example.com/audio.mp3',
        title: 'Test Title'
      });
    });
  });
}); 