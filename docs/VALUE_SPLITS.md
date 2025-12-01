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
