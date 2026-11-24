import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { SITE_OWNER_PUBKEY } from '@/lib/siteOwner';
import { queryRelaysMerged } from '@/lib/queryRelays';
import { DEFAULT_RELAY_URLS } from '@/lib/defaultRelays';

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
 *  2. the app's configured read relays, and
 *  3. wordstr's built-in archive relays (as a permanent fallback).
 *
 * The built-in set is essential: NostrSync replaces the configured relays
 * with the logged-in user's NIP-65 list. Without it, an owner whose list only
 * contains a relay holding two recent posts would still see an incomplete feed.
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
        const relayLists = await queryRelaysMerged(
          nostr,
          [...new Set([...defaultUrls, ...DEFAULT_RELAY_URLS, ...RELAY_DISCOVERY_URLS])],
          [{ kinds: [10002], authors: [SITE_OWNER_PUBKEY] }],
          { signal: c.signal, timeoutMs: 5000 },
        );
        // queryRelaysMerged returns newest first; NSet also keeps only the
        // latest kind 10002 per pubkey, so this is the owner's current list.
        const [relayList] = relayLists;
        writeUrls = (relayList?.tags ?? [])
          .filter(([name, , marker]) => name === 'r' && marker !== 'read')
          .map(([, url]) => normalizeRelayUrl(url))
          .filter(Boolean);
      } catch {
        // Discovery failed — configured and built-in archive relays still apply.
      }

      return [...new Set([...writeUrls, ...defaultUrls, ...DEFAULT_RELAY_URLS])];
    },
  });
}
