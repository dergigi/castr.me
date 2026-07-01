import { normalizeToProfilePointer } from 'applesauce-core/helpers'

/**
 * Returns true if `identifier` decodes to a Nostr profile (npub, nprofile, or hex
 * pubkey). This is a pure, synchronous check — no relay or network work — so it can
 * cheaply gate expensive feed requests before any relay fan-out happens.
 */
export function isValidNostrIdentifier(identifier: string): boolean {
  if (!identifier) return false
  try {
    return normalizeToProfilePointer(identifier) !== null
  } catch {
    return false
  }
}
