# Value Splits in Podcast RSS Feeds

This document explains how value splits are implemented in the podcast RSS feed based on Nostr zap splits.

## Overview

Value splits allow podcast episodes to automatically split Lightning payments among multiple recipients when users boost (send Lightning payments to) podcast episodes. This implementation follows the [Podcasting 2.0 specification](https://github.com/Podcastindex-org/podcast-namespace/blob/3e8c96a695dca831cf3d6df3ed2f8d59a76c216a/docs%2Fexamples%2Fvalue%2Flnaddress.md) and uses Nostr zap splits as defined in [NIP-57](https://nostr-nips.com/nip-57) to determine payment distribution.

## How It Works

### Priority Order

The system determines value splits in the following priority order:

1. **Show Notes (Long-form Content)** - Highest priority
   - If you've created detailed show notes (long-form content, `kind:30023`) for an episode, any zap splits defined there will be used
   - This allows you to set (and update!) specific payment arrangements for each episode, like splitting revenue with guests or co-hosts
   - See [NIP-23](https://nostr-nips.com/nip-23) for long-form content specification

2. **Episode Posts** - Medium priority
   - If no show notes exist, the system looks for zap splits defined directly in the `kind:1` event (the "tweet" you used to post the episode)
   - This ensures zap splits work for episodes where you haven't created separate show notes

3. **Profile Lightning Address** - Default fallback
   - If no zap splits are found anywhere, payments go to the lightning address in your Nostr profile (`lud16` field)
   - The profile owner receives 100% of payments as the default recipient

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

The RSS feed includes a channel-level value tag as a fallback using the profile's lightning address:

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

Individual episodes can override the channel-level value tag with their own splits. The system fetches recipient lightning addresses and names from Nostr profiles:

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

### Example 2: Weighted Split in Show Notes

A `kind:30023` long-form content (show notes) with zap tags:
```
["zap", "pubkey1", "wss://relay.example.com", "2"]
["zap", "pubkey2", "wss://relay.example.com", "1"]
```

Results in a 67/33 split in the RSS feed.

### Example 3: Default Profile Fallback

If no zap splits are found anywhere, the episode uses the profile's lightning address with 100% split:

```xml
<podcast:valueRecipient 
  name="Profile Name"
  type="lnaddress"
  address="profile@example.com"
  split="100"
/>
```

## Technical Implementation

### Code Structure

The implementation is organized into several key components:

- **`PodcastFeedGenerator`**: Handles RSS feed generation and value split logic
- **`NostrService`**: Fetches Nostr events and extracts zap split information
- **`extractZapSplitsFromEvent()`**: Parses zap tags according to NIP-57
- **`fetchZapSplitsWithRecipients()`**: Fetches full recipient information including lightning addresses
- **`generateValueTag()`**: Generates Podcast 2.0 value tag XML

### Key Methods

```typescript
// Extract raw zap splits from an event
extractZapSplitsFromEvent(event: NDKEvent): Array<{ pubkey: string; weight: number }>

// Calculate percentages from raw zap splits
extractZapSplitsWithPercentages(event: NDKEvent): Array<{ pubkey: string; percentage: number }>

// Fetch full recipient information (lightning addresses and names)
fetchZapSplitsWithRecipients(event: NDKEvent): Promise<Array<{ pubkey: string; percentage: number; lightningAddress?: string; name?: string }>>

// Generate value splits for a specific episode with priority handling
generateValueSplitsForEventAsync(event: NDKEvent, longFormMap?: Map<string, NDKEvent>, profile?: NostrProfile, npub?: string): Promise<ValueSplit[]>

// Generate Podcast 2.0 value tag XML
generateValueTag(splits: ValueSplit[]): string
```

### Asynchronous Processing

The system fetches recipient information asynchronously to ensure accurate lightning addresses and names:

1. **Batch Lightning Address Fetching**: Fetches `lud16` fields for all pubkeys in zap splits
2. **Profile Information**: Retrieves recipient names and other metadata
3. **Fallback Handling**: Uses profile lightning address when no zap splits are configured

## HTML View Implementation

The HTML interface displays zap splits in an always-visible section:

- **Always Shows**: Zap splits section is always displayed, even for single recipients
- **Recipient Information**: Shows recipient names and lightning addresses
- **Percentage Display**: Clear indication of payment distribution
- **Default Fallback**: Shows profile owner as recipient when no splits are configured
- **Priority Indication**: Debug logs show which priority level is being used

## Benefits

1. **Automatic Payment Distribution**: Lightning payments are automatically split according to zap configurations
2. **Flexible Configuration**: Different episodes can have different split configurations
3. **Show Notes Integration**: Long-form content can define episode-specific payment splits
4. **Standards Compliance**: Follows [Podcasting 2.0](https://github.com/Podcastindex-org/podcast-namespace) and [Nostr](https://nostr-nips.com/) specifications
5. **Fallback Support**: Gracefully handles cases where zap splits aren't defined
6. **User-Friendly Display**: Always shows who receives payments, even for default cases
7. **Real-time Updates**: Zap splits can be updated by editing show notes or episode posts

## Limitations

1. **Lightning Address Dependency**: Recipients must have lightning addresses in their Nostr profiles (`lud16` field)
2. **Relay Dependency**: Requires reliable relay connections to fetch recipient metadata
3. **Weight Precision**: Percentages are rounded to whole numbers
4. **Profile Completeness**: Requires complete Nostr profiles with lightning addresses

## Future Enhancements

1. **Caching**: Cache recipient profiles to reduce relay queries
2. **Advanced Weight Support**: Support for decimal weights and more precise calculations
3. **Fallback Addresses**: Support for multiple lightning address formats (lud06, etc.)
4. **Split Validation**: Validate that splits add up to 100% and handle edge cases
5. **Offline Support**: Handle cases where relay connections are unavailable

## Related Specifications

- **[NIP-23](https://nostr-nips.com/nip-23)**: Long-form Content (show notes)
- **[NIP-57](https://nostr-nips.com/nip-57)**: Lightning Zaps (zap splits)
- **[Podcasting 2.0 Value Tags](https://github.com/Podcastindex-org/podcast-namespace/blob/3e8c96a695dca831cf3d6df3ed2f8d59a76c216a/docs%2Fexamples%2Fvalue%2Flnaddress.md)**: Lightning address payment specification
- **[Podcast Namespace](https://github.com/Podcastindex-org/podcast-namespace)**: Complete Podcasting 2.0 specification
