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
  const npub = req.params.npub;
  const profile = await nostrService.getUserProfile(npub);
  
  if (!profile) {
    return res.status(404).send('Profile not found');
  }

  const events = await nostrService.getAudioEvents(npub);
  const feed = feedGenerator.generateFeed(profile, events);
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${profile.profile?.name || 'Unknown'} - Podcast Feed</title>
        <style>
          body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }
          .profile { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
          .profile img { width: 150px; height: 150px; border-radius: 75px; object-fit: cover; }
          .profile-info { flex: 1; }
          .episode { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
          .episode h3 { margin-top: 0; }
          .episode audio { width: 100%; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="profile">
          <img src="${profile.profile?.image || 'https://via.placeholder.com/150'}" alt="${profile.profile?.name || 'Profile'}">
          <div class="profile-info">
            <h1>${profile.profile?.name || 'Unknown'}</h1>
            <p>${profile.profile?.about || 'No description available'}</p>
            <p>RSS Feed: <a href="/feed/${npub}">/feed/${npub}</a></p>
          </div>
        </div>
        <h2>Episodes</h2>
        ${events.map(event => `
          <div class="episode">
            <h3>${event.title}</h3>
            <p>${event.content}</p>
            <audio controls src="${event.audioUrl}"></audio>
          </div>
        `).join('')}
      </body>
    </html>
  `);
});

// RSS/XML feed route
app.get('/feed/:npub', async (req, res) => {
  const npub = req.params.npub;
  const profile = await nostrService.getUserProfile(npub);
  
  if (!profile) {
    return res.status(404).send('Profile not found');
  }

  const events = await nostrService.getAudioEvents(npub);
  const feed = feedGenerator.generateFeed(profile, events);
  
  res.set('Content-Type', 'application/xml');
  res.send(feed);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 