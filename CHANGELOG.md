# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.5] - 2025-11-06

### Added
- Nprofile identifier support alongside npub
- Relay hints from nprofile identifiers

### Fixed
- Webpack configuration for nostr-tools in server-side rendering
- URL decoding for nprofile identifiers
- Relay hints combination with default relays

## [0.0.4] - 2025-11-06

### Added
- NPUB input on homepage for custom feed generation
- Keysend support for value recipients using nodeid
- Multiple default relays for better redundancy
- Chronological ordering for HTML views
- Social media preview support (Open Graph and Twitter Cards)

### Changed
- Improved zap splits display and documentation
- Enhanced landing page with examples section
- Updated UI spacing and styling

### Fixed
- Chronological ordering of episodes
- Image optimization for GIFs
- TypeScript type assertions

## [0.0.3] - 2025-04-22

### Added
- NostrService for centralized profile and content fetching
- Show notes support in RSS feeds and HTML views
- Cover images from long-form content
- Episode number matching for show notes

### Changed
- Improved show notes matching with fuzzy title matching
- Better markdown to HTML conversion in feed descriptions

## [0.0.2] - 2025-04-22

### Added
- Video file support in media handling
- RoboHash as fallback podcast artwork
- Links to njump.to for profiles and notes

### Changed
- Domain updated to castr.me
- Improved NPUB validation

### Fixed
- Anonymous fallback names in feed generator
- Media handling unification between HTML and RSS

## [0.0.1] - 2025-04-11

### Added
- Initial release
- Podcast RSS feed generation from Nostr profiles
- HTML view for podcast episodes
- Support for audio content filtering

[0.0.5]: https://github.com/dergigi/pubcaster/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/dergigi/pubcaster/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/dergigi/pubcaster/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/dergigi/pubcaster/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/dergigi/pubcaster/releases/tag/v0.0.1

