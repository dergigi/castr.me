# Value Splits in Podcast RSS Feeds

This document explains how value splits are implemented in the podcast RSS feed based on Nostr zap splits.

## Overview

Value splits allow podcast episodes to automatically split Lightning payments among multiple recipients. This implementation follows the [Podcasting 2.0 specification](https://github.com/Podcastindex-org/podcast-namespace/blob/3e8c96a695dca831cf3d6df3ed2f8d59a76c216a/docs%2Fexamples%2Fvalue%2Flnaddress.md) and uses Nostr zap splits as defined in [NIP-57](https://nostr-nips.com/nip-57) to determine payment distribution.

## How It Works

### Priority Order

Value splits are determined in the following priority order:

1. **Associated Long-form Content (kind:30023)** - Highest priority
   - If a `kind:1` event has an associated `kind:30023` long-form content (show notes)
   - Zap splits defined in the long-form content take precedence
   - This allows for detailed show notes with specific payment splits

2. **Kind:1 Event Zap Splits** - Medium priority
   - If no associated long-form content exists
   - Zap splits defined directly in the `kind:1` event are used

3. **Default Profile Lightning Address** - Lowest priority
   - If no zap splits are found, falls back to the channel-level default
   - Uses the `lud16` field from the Nostr profile

### Zap Split Format

Zap splits follow the [NIP-57 specification](https://nostr-nips.com/nip-57) format:

```
["zap", pubkey, relay, weight, ...]
```

- `pubkey`: The recipient's Nostr public key
- `relay`: Optional relay URL for fetching recipient metadata
- `weight`: Optional weight value (defaults to 1 if not specified)

### Value Split Calculation

1. **Weight-based Distribution**: If weights are specified, percentages are calculated as `(weight / total_weight) * 100`
2. **Equal Distribution**: If no weights are specified, the split is distributed equally among all recipients
3. **Rounding**: Percentages are rounded to whole numbers, with the last recipient getting any remainder

## RSS Feed Implementation

### Channel-Level Value Tag

The RSS feed includes a channel-level value tag as a fallback:

```xml
<podcast:value type="lightning" method="lnaddress">
  <podcast:valueRecipient 
    name="Podcast Name"
    type="lnaddress"
    address="podcaster@example.com"
    split="100"
  />
</podcast:value>
```

### Episode-Level Value Tags

Individual episodes can override the channel-level value tag with their own splits:

```xml
<item>
  <title>Episode Title</title>
  <!-- ... other item tags ... -->
  <podcast:value type="lightning" method="lnaddress">
    <podcast:valueRecipient 
      name="Host Name"
      type="lnaddress"
      address="host@example.com"
      split="60"
    />
    <podcast:valueRecipient 
      name="Guest Name"
      type="lnaddress"
      address="guest@example.com"
      split="40"
    />
  </podcast:value>
</item>
```

## Examples

### Example 1: Simple Two-Way Split

A `kind:1` event with zap tags:
```
["zap", "pubkey1", "wss://relay.example.com", "1"]
["zap", "pubkey2", "wss://relay.example.com", "1"]
```

Results in a 50/50 split in the RSS feed.

### Example 2: Weighted Split

A `kind:30023` long-form content with zap tags:
```
["zap", "pubkey1", "wss://relay.example.com", "2"]
["zap", "pubkey2", "wss://relay.example.com", "1"]
```

Results in a 67/33 split in the RSS feed.

### Example 3: Fallback to Profile

If no zap splits are found, the episode uses the channel-level default from the Nostr profile's `lud16` field.

## Technical Implementation

### Code Structure

- `PodcastFeedGenerator`: Handles RSS feed generation and value split logic
- `NostrService`: Fetches Nostr events and extracts zap split information
- `extractZapSplitsFromEvent()`: Parses zap tags according to NIP-57
- `generateValueTag()`: Generates Podcast 2.0 value tag XML

### Key Methods

```typescript
// Extract zap splits from an event
extractZapSplitsFromEvent(event: NDKEvent): ValueSplit[]

// Generate value splits for a specific episode
generateValueSplitsForEventSync(event: NDKEvent, longFormMap?: Map<string, NDKEvent>): ValueSplit[]

// Generate Podcast 2.0 value tag XML
generateValueTag(splits: ValueSplit[]): string
```

## Benefits

1. **Automatic Payment Distribution**: Lightning payments are automatically split according to zap configurations
2. **Flexible Configuration**: Different episodes can have different split configurations
3. **Show Notes Integration**: Long-form content can define episode-specific payment splits
4. **Standards Compliance**: Follows Podcasting 2.0 and Nostr specifications
5. **Fallback Support**: Gracefully handles cases where zap splits aren't defined

## Limitations

1. **Lightning Address Dependency**: Recipients must have lightning addresses in their Nostr profiles
2. **Relay Dependency**: Requires reliable relay connections to fetch recipient metadata
3. **Synchronous Processing**: Current implementation doesn't fetch lightning addresses asynchronously
4. **Weight Precision**: Percentages are rounded to whole numbers

## Future Enhancements

1. **Async Lightning Address Fetching**: Fetch lightning addresses in parallel for better performance
2. **Caching**: Cache recipient profiles to reduce relay queries
3. **Advanced Weight Support**: Support for decimal weights and more precise calculations
4. **Fallback Addresses**: Support for multiple lightning address formats (lud06, etc.)
5. **Split Validation**: Validate that splits add up to 100% and handle edge cases
