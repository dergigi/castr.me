import { PodcastFeedGenerator } from '../src/services/feed/PodcastFeedGenerator'
import { NostrService } from '../src/services/nostr/NostrService'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { NostrProfile } from '../src/services/nostr/NostrService'

describe('Value Splits', () => {
  let feedGenerator: PodcastFeedGenerator
  let nostrService: NostrService

  beforeEach(() => {
    nostrService = new NostrService()
    feedGenerator = new PodcastFeedGenerator(nostrService)
  })

  describe('extractZapSplitsFromEvent', () => {
    it('should extract equal splits when no weights are specified', () => {
      const mockEvent = {
        tags: [
          ['zap', 'pubkey1', 'wss://relay.example.com'],
          ['zap', 'pubkey2', 'wss://relay.example.com']
        ]
      } as NDKEvent

      const splits = nostrService.extractZapSplitsFromEvent(mockEvent)
      
      expect(splits).toHaveLength(2)
      expect(splits[0]).toEqual({ pubkey: 'pubkey1', weight: 1 })
      expect(splits[1]).toEqual({ pubkey: 'pubkey2', weight: 1 })
    })

    it('should extract weighted splits when weights are specified', () => {
      const mockEvent = {
        tags: [
          ['zap', 'pubkey1', 'wss://relay.example.com', '2'],
          ['zap', 'pubkey2', 'wss://relay.example.com', '1']
        ]
      } as NDKEvent

      const splits = nostrService.extractZapSplitsFromEvent(mockEvent)
      
      expect(splits).toHaveLength(2)
      expect(splits[0]).toEqual({ pubkey: 'pubkey1', weight: 2 })
      expect(splits[1]).toEqual({ pubkey: 'pubkey2', weight: 1 })
    })

    it('should handle invalid weights gracefully', () => {
      const mockEvent = {
        tags: [
          ['zap', 'pubkey1', 'wss://relay.example.com', 'invalid'],
          ['zap', 'pubkey2', 'wss://relay.example.com', '1']
        ]
      } as NDKEvent

      const splits = nostrService.extractZapSplitsFromEvent(mockEvent)
      
      expect(splits).toHaveLength(1)
      expect(splits[0]).toEqual({ pubkey: 'pubkey2', weight: 1 })
    })

    it('should return empty array when no zap tags exist', () => {
      const mockEvent = {
        tags: [['p', 'somepubkey']]
      } as NDKEvent

      const splits = nostrService.extractZapSplitsFromEvent(mockEvent)
      
      expect(splits).toHaveLength(0)
    })
  })

  describe('extractZapSplitsWithPercentages', () => {
    it('should extract equal splits when no weights are specified', () => {
      const mockEvent = {
        tags: [
          ['zap', 'pubkey1', 'wss://relay.example.com'],
          ['zap', 'pubkey2', 'wss://relay.example.com']
        ]
      } as NDKEvent

      const splits = nostrService.extractZapSplitsWithPercentages(mockEvent)
      
      expect(splits).toHaveLength(2)
      expect(splits[0]).toEqual({ pubkey: 'pubkey1', percentage: 50 })
      expect(splits[1]).toEqual({ pubkey: 'pubkey2', percentage: 50 })
    })

    it('should extract weighted splits when weights are specified', () => {
      const mockEvent = {
        tags: [
          ['zap', 'pubkey1', 'wss://relay.example.com', '2'],
          ['zap', 'pubkey2', 'wss://relay.example.com', '1']
        ]
      } as NDKEvent

      const splits = nostrService.extractZapSplitsWithPercentages(mockEvent)
      
      expect(splits).toHaveLength(2)
      expect(splits[0]).toEqual({ pubkey: 'pubkey1', percentage: 67 })
      expect(splits[1]).toEqual({ pubkey: 'pubkey2', percentage: 33 })
    })
  })

  describe('generateValueTag', () => {
    it('should generate correct XML for value splits', () => {
      const splits = [
        { pubkey: 'pubkey1', percentage: 60 },
        { pubkey: 'pubkey2', percentage: 40 }
      ]

      const xml = (feedGenerator as any).generateValueTag(splits)
      
      expect(xml).toContain('<podcast:value type="lightning" method="lnaddress">')
      expect(xml).toContain('name="Recipient pubkey1"')
      expect(xml).toContain('address="unknown@pubkey1.ln"')
      expect(xml).toContain('split="60"')
      expect(xml).toContain('name="Recipient pubkey2"')
      expect(xml).toContain('address="unknown@pubkey2.ln"')
      expect(xml).toContain('split="40"')
    })

    it('should return empty string for empty splits', () => {
      const xml = (feedGenerator as any).generateValueTag([])
      expect(xml).toBe('')
    })
  })

  describe('generateValueSplitsForEventSync', () => {
    it('should prioritize long-form content zap splits', () => {
      const mockEvent = {
        content: 'Episode Title\nAudio content',
        tags: [
          ['zap', 'pubkey1', 'wss://relay.example.com', '1']
        ]
      } as NDKEvent

      const mockLongFormEvent = {
        content: 'Show notes content',
        tags: [
          ['zap', 'pubkey2', 'wss://relay.example.com', '2'],
          ['zap', 'pubkey3', 'wss://relay.example.com', '1']
        ]
      } as NDKEvent

      const longFormMap = new Map([['Episode Title', mockLongFormEvent]])

      const splits = (feedGenerator as any).generateValueSplitsForEventSync(mockEvent, longFormMap)
      
      // Should use long-form splits (67/33) instead of kind:1 splits (100)
      expect(splits).toHaveLength(2)
      expect(splits[0]).toEqual({ pubkey: 'pubkey2', percentage: 67 })
      expect(splits[1]).toEqual({ pubkey: 'pubkey3', percentage: 33 })
    })

    it('should fall back to kind:1 splits when no long-form content exists', () => {
      const mockEvent = {
        content: 'Episode Title\nAudio content',
        tags: [
          ['zap', 'pubkey1', 'wss://relay.example.com', '1'],
          ['zap', 'pubkey2', 'wss://relay.example.com', '1']
        ]
      } as NDKEvent

      const splits = (feedGenerator as any).generateValueSplitsForEventSync(mockEvent, new Map())
      
      expect(splits).toHaveLength(2)
      expect(splits[0]).toEqual({ pubkey: 'pubkey1', percentage: 50 })
      expect(splits[1]).toEqual({ pubkey: 'pubkey2', percentage: 50 })
    })

    it('should return empty array when no zap splits exist', () => {
      const mockEvent = {
        content: 'Episode Title\nAudio content',
        tags: [['p', 'somepubkey']]
      } as NDKEvent

      const splits = (feedGenerator as any).generateValueSplitsForEventSync(mockEvent, new Map())
      
      expect(splits).toHaveLength(0)
    })
  })
})
