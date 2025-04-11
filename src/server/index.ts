import express from 'express';
import { NostrService } from '../services/nostr/NostrService';
import { PodcastFeedGenerator } from '../services/podcast/PodcastFeedGenerator';

const app = express();
const port = process.env.PORT || 3000;

const nostrService = new NostrService();
const feedGenerator = new PodcastFeedGenerator();

// Initialize Nostr service
nostrService.initialize().catch(console.error);

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

// Main route handler
app.get('/:npub', async (req, res) => {
  try {
    const { npub } = req.params;
    const profile = await nostrService.getUserProfile(npub);
    
    if (!profile) {
      return res.status(404).send('Profile not found');
    }
    
    const audioEvents = await nostrService.getAudioEvents(npub);

    if (res.locals.format === 'xml') {
      const feed = feedGenerator.generateFeed(profile, audioEvents);
      res.type('application/rss+xml').send(feed);
    } else {
      // For now, just send a simple HTML response
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${profile.name || 'Untitled Podcast'}</title>
            <meta charset="utf-8">
            <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .episode { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
              audio { width: 100%; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h1>${profile.name || 'Untitled Podcast'}</h1>
            <p>${profile.about || ''}</p>
            ${audioEvents.map(event => `
              <div class="episode">
                <h2>${event.title || 'Untitled Episode'}</h2>
                <p>${event.content}</p>
                <audio controls src="${event.audioUrl}"></audio>
              </div>
            `).join('')}
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error generating feed');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 