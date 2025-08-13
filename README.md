# Castr.me

Effortlessly turn your npub into a podcast feed.

## Overview

Castr.me is a service that automatically generates podcast feeds from Nostr profiles. It converts `kind1` events containing audio (and video) file links into a valid Podcasting 2.0 feed.

## Examples

- [No Solutions](https://castr.me/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n)
- [ODELL](https://castr.me/npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx)
- [Marty Bent](https://castr.me/npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy)
- [Gigi](https://castr.me/npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc)
- [Ryan](https://castr.me/npub1m64hnkh6rs47fd9x6wk2zdtmdj4qkazt734d22d94ery9zzhne5qw9uaks)
- [HODL](https://castr.me/npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs)
- [yellow](https://castr.me/npub1nw5vdz8sj89y3h3tp7dunx8rhsm2qzfpf8ujq9m8mfvjsjth0uwqs9n2gn)

## Features

- Automatic feed generation from npubs
- Audio file detection and filtering
- Podcast 2.0 namespace support
- Simple and clean HTML interface
- Zero configuration required
- Default profile support
- Show notes support via long-form content
- Markdown rendering for show notes

## Still TODO

- [ ] Create `<value>` tags based on zap splits
- [ ] Somehow link to transcripts file (and add it to the RSS feed)
- [ ] Implement content negotiation, i.e. render RSS/HTML based on request
- [ ] Properly query relays, the way it's done now is stupid
- [ ] Make stuff configurable, especially what relays to use
- [ ] ...lots of other stuff...

## Show Notes

Show notes are implemented using Nostr's long-form content (`kind:30023`) events. The system links show notes to audio episodes by matching their titles on a best effort basis:

1. When a `kind:1` event contains an audio file, its first line is treated as the episode title
2. The system searches for a `kind:30023` event with a matching title
3. If found, the long-form content is displayed as expandable show notes under the episode
4. Show notes are rendered as GitHub-flavored markdown

This allows podcasters to maintain detailed show notes separate from the audio post while keeping them properly linked.

## Zap Splits & Value Splits

Whatever is defined in the associated long-form `kind:30023` is taken as gospel, and will be used as the basis for the `<value>` splits.

## Installation

```bash

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
