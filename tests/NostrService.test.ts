import { NostrService } from '../src/services/nostr/NostrService';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { MediaEvent } from '../src/types';

// Create a test class that extends NostrService to access protected methods
class TestNostrService extends NostrService {
  public testTransformToMediaEvent(event: NDKEvent): MediaEvent {
    return this.transformToMediaEvent(event);
  }
}

describe('NostrService', () => {
  let nostrService: TestNostrService;

  beforeEach(() => {
    nostrService = new TestNostrService();
    // Initialize the NDK instance for testing
    nostrService.initialize();
  });

  describe('defaultIdentifier', () => {
    it('should have the correct default identifier', () => {
      // Access the private property using bracket notation
      const defaultIdentifier = (nostrService as any).defaultIdentifier;
      expect(defaultIdentifier).toBe('npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n');
    });
  });

  describe('getPubkeyFromIdentifier', () => {
    it('should extract pubkey from npub', () => {
      const npub = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n';
      const pubkey = (nostrService as any).getPubkeyFromIdentifier(npub);
      expect(pubkey).toBeTruthy();
      expect(typeof pubkey).toBe('string');
      expect(pubkey.length).toBe(64); // Hex pubkey is 64 characters
    });

    it('should extract pubkey from nprofile', () => {
      // Example nprofile (you may need to replace with a real one)
      const nprofile = 'nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p';
      const pubkey = (nostrService as any).getPubkeyFromIdentifier(nprofile);
      expect(pubkey).toBeTruthy();
      expect(typeof pubkey).toBe('string');
      expect(pubkey.length).toBe(64); // Hex pubkey is 64 characters
    });

    it('should return null for invalid identifier', () => {
      const invalid = 'invalid-identifier';
      const pubkey = (nostrService as any).getPubkeyFromIdentifier(invalid);
      expect(pubkey).toBeNull();
    });

    it('should return null for favicon.ico', () => {
      const pubkey = (nostrService as any).getPubkeyFromIdentifier('favicon.ico');
      expect(pubkey).toBeNull();
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

  describe('transformToMediaEvent', () => {
    it('should transform NDKEvent to MediaEvent', () => {
      const mockNDKEvent: NDKEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'Test content with https://example.com/audio.mp3',
        tags: [['title', 'Test Title']],
        sig: 'test-sig'
      } as NDKEvent;

      const result = nostrService.testTransformToMediaEvent(mockNDKEvent);

      expect(result).toEqual({
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        content: 'Test content with https://example.com/audio.mp3',
        tags: [['title', 'Test Title']],
        sig: 'test-sig',
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: undefined,
        mediaType: 'audio',
        title: 'Test Title'
      });
    });
  });

  describe('findMatchingLongFormContent', () => {
    it('should find a long-form content event that matches the title of a kind1 event', async () => {
      // Initialize the NDK instance for testing
      await nostrService.initialize();
      
      // Use real event IDs
      const kind1EventId = 'nevent1qqszlf337y0lkg4sz5ax9ath4y5vk6rpqn9tfewaln2989zavvqrg4czyzdauss5j8e745dvyx736qtx024egl6vr39wmpmzfnezwwcxegzjkj3qfzd';
      const longFormEventId = 'naddr1qvzqqqr4gupzpx77gg2frul26xkzr0gaq9n842u50axpcjhdsa3yeu388vrv5pftqqvnqd3d235x2t2hd9hxgueddanz6s2f94jnye3kve4sh9v6es';
      
      // Fetch the real events
      const kind1Event = await nostrService.getEventById(kind1EventId);
      const longFormEvent = await nostrService.getEventById(longFormEventId);
      
      // Verify that both events were found
      expect(kind1Event).not.toBeNull();
      expect(longFormEvent).not.toBeNull();
      
      if (kind1Event && longFormEvent) {
        // Call the method with the real kind1 event
        const result = await nostrService.findMatchingLongFormContent(kind1Event);
        
        // Verify the result
        expect(result).not.toBeNull();
        if (result) {
          // Check that the result has the same title as the kind1 event
          const kind1Title = nostrService['extractTitle'](kind1Event);
          const resultTitle = nostrService['extractTitle'](result);
          expect(resultTitle).toBe(kind1Title);
          
          // Check that the result is a kind 30023 event
          expect(result.kind).toBe(30023);
        }
      }
    }, 30000);

    it('should find a long-form content event by matching episode number', async () => {
      // Initialize the NDK instance for testing
      await nostrService.initialize();
      
      // Use real event IDs for episode number matching test
      const kind1EventId = 'nevent1qqsq92p3qgyjnqn9rm7k87fdaq4aqqhwpdteuaam2q0s7dqjsf9lpgqpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dspzpx77gg2frul26xkzr0gaq9n842u50axpcjhdsa3yeu388vrv5pftnp2759';
      const longFormEventId = 'naddr1qvzqqqr4gupzpx77gg2frul26xkzr0gaq9n842u50axpcjhdsa3yeu388vrv5pftqq24qjmxf5m525zyg3gygemv94q5232rxf9xvdz74hz';
      
      // Fetch the real events
      const kind1Event = await nostrService.getEventById(kind1EventId);
      const longFormEvent = await nostrService.getEventById(longFormEventId);
      
      // Verify that both events were found
      expect(kind1Event).not.toBeNull();
      expect(longFormEvent).not.toBeNull();
      
      if (kind1Event && longFormEvent) {
        // Call the method with the real kind1 event
        const result = await nostrService.findMatchingLongFormContent(kind1Event);
        
        // Verify the result
        expect(result).not.toBeNull();
        if (result) {
          // Extract episode numbers from both events
          const kind1Title = nostrService['extractTitle'](kind1Event);
          const resultTitle = nostrService['extractTitle'](result);
          const kind1EpisodeNumber = nostrService['extractEpisodeNumber'](kind1Title);
          const resultEpisodeNumber = nostrService['extractEpisodeNumber'](resultTitle);
          
          // Verify that both events have matching episode numbers
          expect(kind1EpisodeNumber).not.toBeNull();
          expect(resultEpisodeNumber).not.toBeNull();
          expect(kind1EpisodeNumber).toBe(resultEpisodeNumber);
          
          // Check that the result is a kind 30023 event
          expect(result.kind).toBe(30023);
        }
      }
    }, 30000);

    it('should have episode number "01" for the kind1 event', async () => {
      // Initialize the NDK instance for testing
      await nostrService.initialize();
      
      // Use the real kind1 event ID
      const kind1EventId = 'nevent1qqsq92p3qgyjnqn9rm7k87fdaq4aqqhwpdteuaam2q0s7dqjsf9lpgqpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dspzpx77gg2frul26xkzr0gaq9n842u50axpcjhdsa3yeu388vrv5pftnp2759';
      
      // Fetch the real event
      const kind1Event = await nostrService.getEventById(kind1EventId);
      
      // Verify that the event was found
      expect(kind1Event).not.toBeNull();
      
      if (kind1Event) {
        // Extract the title and episode number
        const kind1Title = nostrService['extractTitle'](kind1Event);
        const kind1EpisodeNumber = nostrService['extractEpisodeNumber'](kind1Title);
        
        // Verify that the episode number is "01"
        expect(kind1EpisodeNumber).toBe("01");
      }
    }, 30000);
    
    it('should return null if no matching long-form content is found', async () => {
      // Initialize the NDK instance for testing
      await nostrService.initialize();
      
      // Create a kind1 event with a unique title that won't have a matching long-form content
      const mockKind1Event = new NDKEvent();
      mockKind1Event.content = 'This is a unique title that should not have a matching long-form content\nThis is a podcast episode.';
      mockKind1Event.pubkey = 'test-pubkey';
      
      // Call the method
      const result = await nostrService.findMatchingLongFormContent(mockKind1Event);
      
      // Verify the result
      expect(result).toBeNull();
    });
  });

  describe('getEventById', () => {
    it('should fetch a long-form content event by its naddr ID', async () => {
      // Initialize the NDK instance for testing
      await nostrService.initialize();
      
      // Use a real naddr event ID
      const longFormEventId = 'naddr1qvzqqqr4gupzpx77gg2frul26xkzr0gaq9n842u50axpcjhdsa3yeu388vrv5pftqqvnqd3d235x2t2hd9hxgueddanz6s2f94jnye3kve4sh9v6es';
      
      // Fetch the event
      const event = await nostrService.getEventById(longFormEventId);
      
      // Verify that the event was found
      expect(event).not.toBeNull();
      if (event) {
        // Verify that it's a kind 30023 event (long-form content)
        expect(event.kind).toBe(30023);
        
        // Verify that it has a title
        const title = nostrService['extractTitle'](event);
        expect(title).toBe('06: The Winds of AI');
      }
    }, 30000); // Increase timeout for this test since it's making real network requests
  });

  describe('getLongFormEvents', () => {
    it('should fetch all long-form content events for a user', async () => {
      // Initialize the NDK instance for testing
      await nostrService.initialize();
      
      // Use the default npub
      const npub = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n';
      
      // Fetch all long-form events
      const events = await nostrService.getLongFormEvents(npub);
      
      // Verify that events were found
      expect(events.length).toBeGreaterThan(0);
      
      // Verify that all events are kind 30023 (long-form content)
      for (const event of events) {
        expect(event.kind).toBe(30023);
      }
      
      // Verify that at least one event has the expected title
      const titles = events.map(event => nostrService['extractTitle'](event));
      expect(titles).toContain('06: The Winds of AI');
    }, 30000); // Increase timeout for this test since it's making real network requests
  });
}); 