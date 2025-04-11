import request from 'supertest';
import express from 'express';
import { NostrService } from '../src/services/nostr/NostrService';
import { PodcastFeedGenerator } from '../src/services/podcast/PodcastFeedGenerator';

// Create a mock app for testing
const app = express();
const nostrService = new NostrService();
const feedGenerator = new PodcastFeedGenerator();

// Content negotiation middleware
app.use((req, res, next) => {
  const acceptHeader = req.headers.accept || '';
  res.locals.format = acceptHeader.includes('application/rss+xml') ? 'xml' : 'html';
  next();
});

// Root route handler - redirects to default npub
app.get('/', (req, res) => {
  res.redirect('/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n');
});

// Mock the NostrService methods
jest.mock('../src/services/nostr/NostrService', () => {
  return {
    NostrService: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        getUserProfile: jest.fn().mockResolvedValue({
          name: 'Test Podcast',
          about: 'Test Description',
          image: 'https://example.com/image.jpg',
          nip05: 'test@example.com'
        }),
        getAudioEvents: jest.fn().mockResolvedValue([
          {
            id: '1',
            pubkey: 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n',
            created_at: 1234567890,
            content: 'Test episode content',
            tags: [],
            sig: 'test',
            audioUrl: 'https://example.com/episode.mp3',
            title: 'Test Episode'
          }
        ])
      };
    })
  };
});

// Mock the PodcastFeedGenerator methods
jest.mock('../src/services/podcast/PodcastFeedGenerator', () => {
  return {
    PodcastFeedGenerator: jest.fn().mockImplementation(() => {
      return {
        generateFeed: jest.fn().mockReturnValue('<rss>Test Feed</rss>')
      };
    })
  };
});

describe('Server', () => {
  describe('GET /', () => {
    it('should redirect to the default npub', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n');
    });
  });
}); 