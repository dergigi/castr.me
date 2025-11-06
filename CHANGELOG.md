# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-XX

### Fixed
- Chronological ordering in HTML views
- Linting issues in NostrService

## [1.0.1] - 2025-01-XX

### Added
- Keysend support for value recipients using profile nodeid
- NPub input on homepage for custom feeds
- NDK Dexie cache adapter for client-side caching
- MIME type detection for media without file extensions
- Prefetching for faster navigation

### Changed
- URL updates immediately on valid npub input (no debounce)
- Media search links now use actual links

### Fixed
- SSR issues with Dexie cache adapter
- MIME detection redirects and timeouts
- Markdown parsing errors in show notes
- Media detection in RSS feeds

## [0.1.0] - 2025-01-XX

### Added
- Initial podcast feed generator for Nostr profiles
- Next.js UI with Tailwind CSS
- RSS feed generation at `/npub/rss.xml`
- Audio and video file support
- RoboHash fallback for podcast artwork

[0.1.1]: https://github.com/dergigi/pubcaster/compare/v1.0.1...v0.1.1
[1.0.1]: https://github.com/dergigi/pubcaster/compare/v0.1.0...v1.0.1
[0.1.0]: https://github.com/dergigi/pubcaster/releases/tag/v0.1.0

