# Castr

Effortlessly turn your Npub profile into a podcast feed.

## Overview

Castr is a service that automatically generates podcast feeds from Nostr profiles. It converts kind1 events containing audio file links into a valid Podcasting 2.0 feed.

## Features

- Automatic feed generation from Npub profiles
- Content negotiation (HTML/RSS)
- Audio file detection and filtering
- Podcast 2.0 namespace support
- Simple and clean HTML interface
- Zero configuration required
- Default profile support

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/castr.git
cd castr

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test
```

## Usage

1. Access your podcast feed by visiting:
   ```
   http://localhost:3000/YOUR_NPUB
   ```

2. For RSS feed, use an RSS reader or podcast app with the URL:
   ```
   http://localhost:3000/YOUR_NPUB
   ```
   (The feed will automatically be served as RSS when requested by a podcast app)

3. Default profile:
   - Visit the root URL to see the default profile:
   ```
   http://localhost:3000/
   ```
   - Default npub: `npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n`

## Configuration

- Default relay: `wss://relay.nostr.band`
- Default npub: `npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n`

## API

### GET /

Redirects to the default npub profile.

### GET /:npub

Generates a podcast feed for the specified Npub.

- **Parameters:**
  - `npub` (path parameter): The Nostr public key

- **Response:**
  - HTML page for browser requests
  - RSS/XML feed for podcast app requests

## License

ISC 