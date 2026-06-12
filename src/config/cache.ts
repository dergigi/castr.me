/**
 * Cache-Control values for feed responses.
 *
 * These offload the bulk of feed traffic to the CDN (Vercel edge) so repeated
 * polls don't each trigger a relay fan-out. Podcast clients typically re-poll
 * every 15–60 minutes; an `s-maxage` window collapses those into roughly one
 * origin render per window per npub.
 */

/**
 * Successful feed: CDN-cache for 15 minutes, then serve the stale copy for up to
 * an hour while a single background request revalidates it. Clients never wait on
 * a relay fetch once a feed is warm.
 */
export const FEED_CACHE_CONTROL = 'public, s-maxage=900, stale-while-revalidate=3600'

/**
 * Profile/feed not found: short negative cache so repeated misses don't re-hit
 * relays, while a newly-published profile still appears within a few minutes.
 */
export const FEED_NOT_FOUND_CACHE_CONTROL = 'public, s-maxage=300'

/**
 * Malformed identifier: cache hard. A string that doesn't decode to a pubkey will
 * never become valid, so absorbing repeat hits at the CDN blunts garbage-key abuse.
 */
export const FEED_INVALID_CACHE_CONTROL = 'public, s-maxage=86400'

/**
 * Transient server error (e.g. a relay hiccup): never cache, so a temporary
 * failure isn't pinned in front of users.
 */
export const FEED_ERROR_CACHE_CONTROL = 'no-store'
