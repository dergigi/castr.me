import { relaySet } from "applesauce-core/helpers";

const parseRelayList = (value: string | undefined, fallback: string[]): string[] => {
	return value ? value.split(',').map(relay => relay.trim()).filter(Boolean) : fallback;
}

/** Port number for the Express server (server-side only) */
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/** HTTP gateway URL for linking to Nostr profiles and events (e.g., njump.to) */
export const HTTP_NOSTR_GATEWAY = process.env.HTTP_NOSTR_GATEWAY || 'https://njump.to';

/** Base URL of the application, used for generating absolute URLs (e.g., RSS feed links) */
export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://castr.me';

/** Fathom Analytics site ID for tracking page views (optional, client-side only) */
export const NEXT_PUBLIC_FATHOM_ID = process.env.NEXT_PUBLIC_FATHOM_ID || '';

/** Extra relays to use for the Nostr service */
export const EXTRA_RELAYS = relaySet(parseRelayList(process.env.EXTRA_RELAYS, [
	'wss://wot.dergigi.com',
	'wss://wot.utxo.one',
	'wss://relay.damus.io'
]))

/** Extra relays used for looking up user profiles and mailboxes */
export const LOOKUP_RELAYS = relaySet(parseRelayList(process.env.LOOKUP_RELAYS, [
	'wss://purplepag.es',
	'wss://indexer.coracle.social',
]))

/** Default identifier to use for the Nostr service */
export const DEFAULT_IDENTIFIER = process.env.DEFAULT_IDENTIFIER || 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n';
