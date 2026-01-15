/** Port number for the Express server (server-side only) */
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/** HTTP gateway URL for linking to Nostr profiles and events (e.g., njump.to) */
export const HTTP_NOSTR_GATEWAY = process.env.HTTP_NOSTR_GATEWAY || 'https://njump.to';

/** Base URL of the application, used for generating absolute URLs (e.g., RSS feed links) */
export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://castr.me';

/** Fathom Analytics site ID for tracking page views (optional, client-side only) */
export const NEXT_PUBLIC_FATHOM_ID = process.env.NEXT_PUBLIC_FATHOM_ID || '';
