# Castr.me

Effortlessly turn your npub into a podcast feed.

## Overview

Castr.me is a service that automatically generates podcast feeds from Nostr profiles. It converts `kind1` events containing audio (and video) file links into a valid Podcasting 2.0 feed.

**🌐 Live at: [https://castr.me/](https://castr.me/)**

## How It Works

Castr.me scans a Nostr profile's posts and looks for `kind1` events that contain links to audio or video files. When it finds media content, it automatically generates a podcast RSS feed that you can subscribe to in any podcast app.

**Important:** Castr.me only works for npubs who have actually posted audio or video content to Nostr. If a profile hasn't shared any media files, there won't be anything to convert into a podcast feed. The service will show an empty feed or "No media posts found" message for profiles without media content.

## Examples

- [No Solutions](https://castr.me/npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n)
- [Citadel Dispatch](https://castr.me/npub10atn74wcwh8gahzj3m0cy22fl54tn7wxtkg55spz2e3mpf5hhcrs4602w3)
- [TFTC](https://castr.me/npub1sk7mtp67zy7uex2f3dr5vdjynzpwu9dpc7q4f2c8cpjmguee6eeq56jraw)
- [The Good Stuff](https://castr.me/npub1wtx46rfjvevydmp8espegmw2tz93ujyg4es3eqwzle2jjft0p23qdu0rjx)
- [ODELL](https://castr.me/npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx)
- [Marty Bent](https://castr.me/npub1guh5grefa7vkay4ps6udxg8lrqxg2kgr3qh9n4gduxut64nfxq0q9y6hjy)
- [HODL](https://castr.me/npub1rtlqca8r6auyaw5n5h3l5422dm4sry5dzfee4696fqe8s6qgudks7djtfs)
- [yellow](https://castr.me/npub1nw5vdz8sj89y3h3tp7dunx8rhsm2qzfpf8ujq9m8mfvjsjth0uwqs9n2gn)
- [Jack Mallers](https://castr.me/npub1cn4t4cd78nm900qc2hhqte5aa8c9njm6qkfzw95tszufwcwtcnsq7g3vle)
- [Guy Swann](https://castr.me/npub1h8nk2346qezka5cpm8jjh3yl5j88pf4ly2ptu7s6uu55wcfqy0wq36rpev)
- [Paul Keating](https://castr.me/npub1spdnfacgsd7lk0nlqkq443tkq4jx9z6c6ksvaquuewmw7d3qltpslcq6j7)
- [Bitman](https://castr.me/npub1z204rz2az24ne8xuym9j90dmnh533e03elucjslnsc802wjyrqps6vmxwn)
- [Gigi](https://castr.me/npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc)
- [Ryan](https://castr.me/npub1m64hnkh6rs47fd9x6wk2zdtmdj4qkazt734d22d94ery9zzhne5qw9uaks)
- [Movie Archive](https://castr.me/npub1tn2lspfvv7g7fpulpexmjy6xt4c36h6lurq2hxgyn3sxf3drjk3qrchmc3)
- [New Music Nudge Unit](https://castr.me/npub1ztzpz9xepmxsry7jqdhjc32dh5wtktpnn9kjq5eupdwdq06gdn6s0d7zxv)

## Finding Content

You can discover profiles that post media using search queries on Nostr search engines. For example:
- `https://nostr.band/?q=.mp4` - Find profiles posting video files
- `https://nostr.band/?q=.mp3` - Find profiles posting audio files
- `https://nostr.band/?q=.m4a` - Find profiles posting podcast audio

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

- [x] Create `<value>` tags based on zap splits
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

TL;DR: Whatever is defined in the associated long-form `kind:30023` is taken as gospel, and will be used as the basis for the <value> splits. Fallback is the `kind:1`. Ultimate fallback is the `lud06` lightning address set in your nostr profile.

We use zap splits to automatically create Podcasting 2.0 value splits so that Lightning payments can be distributed among multiple recipients when users boost podcast episodes.

If you've created detailed show notes (long-form content, see above) for an episode, any zap splits defined in the long-form post will be used. This allows you to set (and update!) specific payment arrangements for each episode, like splitting revenue with guests or co-hosts.

If no show notes exist, the system looks for zap splits defined directly in the `kind1` (read: "tweet") that you used to post the episode. This makes sure that zap splits work for episodes where you haven't created separate show notes.

If no zap splits are found anywhere, payments in the form of zaps or boosts go to the lightning address in your Nostr profile.

See [VALUE_SPLITS.md](docs/VALUE_SPLITS.md) for details.

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

- Default relays: 
  - `wss://relay.nostr.band`
  - `wss://wot.dergigi.com/`
  - `wss://wot.utxo.one`
  - `wss://relay.damus.io`
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
