import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { SITE_OWNER_PUBKEY } from '@/lib/siteOwner';

/**
 * Well-known relay-list aggregators, used to discover the site owner's
 * NIP-65 relay list even when it isn't on the app's default relays.
 */
const RELAY_DISCOVERY_URLS = ['wss://purplepag.es', 'wss://relay.nostr.band'];

/** Normalize a relay URL for deduplication (trim, strip trailing slash, lowercase). */
function normalizeRelayUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

/**
 * Outbox-model relay discovery for the site owner.
 *
 * Returns the union of:
 *  1. the owner's NIP-65 (kind 10002) *write* relays — where their posts
 *     actually live, per the outbox model, and
 *  2. the app's configured read relays (as a fallback).
 *
 * Querying this set makes the homepage feeds complete and consistent,
 * regardless of which default relay happens to answer, or whether
 * NostrSync has swapped the pool for the logged-in user's relay list.
 */
export function useOwnerWriteRelays(enabled = true) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  const defaultUrls = config.relayMetadata.relays
    .filter((r) => r.read)
    .map((r) => normalizeRelayUrl(r.url));

  return useQuery<string[]>({
    queryKey: ['wordstr', 'owner-write-relays', SITE_OWNER_PUBKEY, defaultUrls],
    enabled,
    staleTime: 10 * 60 * 1000, // relay lists change rarely
    queryFn: async (c) => {
      let writeUrls: string[] = [];

      try {
        const discovery = nostr.group([...new Set([...defaultUrls, ...RELAY_DISCOVERY_URLS])]);
        const [relayList] = await discovery.query(
          [{ kinds: [10002], authors: [SITE_OWNER_PUBKEY], limit: 1 }],
          { signal: c.signal },
        );
        writeUrls = (relayList?.tags ?? [])
          .filter(([name, , marker]) => name === 'r' && marker !== 'read')
          .map(([, url]) => normalizeRelayUrl(url))
          .filter(Boolean);
      } catch {
        // Discovery failed — fall back to the app's default relays only.
      }

      return [...new Set([...writeUrls, ...defaultUrls])];
    },
  });
}
