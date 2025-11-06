# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-06

### Added
- NPUB input on homepage for custom feeds
- Keysend support for value recipients using nodeid
- Multiple default relays for better redundancy
- Podcasting 2.0 value tag with Lightning address support
- Zap splits display with nodeid support
- Local profile images as fallbacks
- New example profiles (Bitman, Citadel Dispatch, The Good Stuff)
- Social media preview support (Open Graph and Twitter Cards)
- Back button on profile pages
- Copy button with visual feedback

### Changed
- Episodes now display in chronological order
- URL updates immediately on valid npub input (no debounce)
- Prefetch demo feed route on load for faster navigation
- Relay URLs normalized

### Fixed
- Chronological ordering in HTML views
- GIF optimization issues with Next.js Image tags
- TypeScript type assertions and return types
- Lightning address extraction from Nostr profiles
- Podcasting 2.0 value tag compliance

## [0.0.3] - 2025-04-22

### Added
- Initial release
- RSS feed generation for Nostr profiles
- Show notes from long-form content
- Zap profile pictures in episodes
- Value recipients section

