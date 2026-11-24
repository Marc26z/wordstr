/**
 * wordstr's built-in relay set.
 *
 * Keep this separate from the user's synced NIP-65 relay list so site-owner
 * feeds can always query relays that retain the complete publication archive.
 */
export const DEFAULT_RELAY_URLS = [
  // Major general-purpose relays
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://relay.ditto.pub',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.snort.social',
  // Long-form / article-friendly relays
  'wss://relay.nostr.hu',
  'wss://nostr.mom',
  'wss://relay.orangepill.dev',
  'wss://offchain.pub',
  // Well-known stable relays
  'wss://nostr.fmt.wiz.biz',
  'wss://eden.nostr.land',
  'wss://relay.current.fyi',
];
