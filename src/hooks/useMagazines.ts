import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { KIND_MAGAZINE, KIND_MAGAZINE_ISSUE, KIND_EBOOK } from '@/lib/pressstr';
import { SITE_OWNER_PUBKEY } from '@/lib/siteOwner';
import { useOwnerWriteRelays } from '@/hooks/useOwnerWriteRelays';
import { queryRelaysMerged } from '@/lib/queryRelays';

/**
 * Fetch all magazines published by the site owner.
 * Queries the owner's NIP-65 write relays (outbox model) plus the app
 * defaults, so content shows up completely and consistently.
 */
export function useMagazines() {
  const { nostr } = useNostr();
  const { data: relayUrls } = useOwnerWriteRelays();

  return useQuery<NostrEvent[]>({
    queryKey: ['pressstr', 'magazines', relayUrls],
    enabled: Boolean(relayUrls),
    queryFn: async (c) =>
      queryRelaysMerged(
        nostr,
        relayUrls ?? [],
        [{ kinds: [KIND_MAGAZINE], authors: [SITE_OWNER_PUBKEY], limit: 100 }],
        { signal: c.signal },
      ),
  });
}

/** Fetch a single magazine by author + d tag */
export function useMagazine(pubkey: string | undefined, dTag: string | undefined) {
  const { nostr } = useNostr();
  return useQuery<NostrEvent | undefined>({
    queryKey: ['pressstr', 'magazine', pubkey, dTag],
    enabled: Boolean(pubkey && dTag),
    queryFn: async (c) => {
      if (!pubkey || !dTag) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_MAGAZINE], authors: [pubkey], '#d': [dTag], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });
}

/** Fetch all issues for a magazine coordinate */
export function useMagazineIssues(magazineCoord: string | undefined) {
  const { nostr } = useNostr();
  return useQuery<NostrEvent[]>({
    queryKey: ['pressstr', 'issues', magazineCoord],
    enabled: Boolean(magazineCoord),
    queryFn: async (c) => {
      if (!magazineCoord) return [];
      const events = await nostr.query(
        [{ kinds: [KIND_MAGAZINE_ISSUE], '#a': [magazineCoord], limit: 200 }],
        { signal: c.signal },
      );
      // Sort by issue published_at descending
      return events.sort((a, b) => {
        const aAt = Number(a.tags.find(([n]) => n === 'published_at')?.[1] ?? a.created_at);
        const bAt = Number(b.tags.find(([n]) => n === 'published_at')?.[1] ?? b.created_at);
        return bAt - aAt;
      });
    },
  });
}

/** Fetch a single magazine issue by author + d tag */
export function useMagazineIssue(pubkey: string | undefined, dTag: string | undefined) {
  const { nostr } = useNostr();
  return useQuery<NostrEvent | undefined>({
    queryKey: ['pressstr', 'issue', pubkey, dTag],
    enabled: Boolean(pubkey && dTag),
    queryFn: async (c) => {
      if (!pubkey || !dTag) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_MAGAZINE_ISSUE], authors: [pubkey], '#d': [dTag], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });
}

/** Fetch all ebooks (optionally filtered by author) */
export function useEbooks(authorPubkey?: string) {
  const { nostr } = useNostr();
  const isOwnerFeed = authorPubkey === SITE_OWNER_PUBKEY;
  const { data: relayUrls } = useOwnerWriteRelays(isOwnerFeed);

  return useQuery<NostrEvent[]>({
    queryKey: ['pressstr', 'ebooks', authorPubkey ?? 'all', isOwnerFeed ? relayUrls : undefined],
    enabled: isOwnerFeed ? Boolean(relayUrls) : true,
    queryFn: async (c) => {
      const filter = authorPubkey
        ? { kinds: [KIND_EBOOK], authors: [authorPubkey], limit: 200 }
        : { kinds: [KIND_EBOOK], limit: 100 };
      // Owner feed: query the owner's write relays (outbox model) for completeness.
      if (isOwnerFeed && relayUrls) {
        return queryRelaysMerged(nostr, relayUrls, [filter], { signal: c.signal });
      }
      return nostr.query([filter], { signal: c.signal });
    },
  });
}

/** Fetch a single ebook by author + d tag */
export function useEbook(pubkey: string | undefined, dTag: string | undefined) {
  const { nostr } = useNostr();
  return useQuery<NostrEvent | undefined>({
    queryKey: ['pressstr', 'ebook', pubkey, dTag],
    enabled: Boolean(pubkey && dTag),
    queryFn: async (c) => {
      if (!pubkey || !dTag) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_EBOOK], authors: [pubkey], '#d': [dTag], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });
}

/** Fetch all magazines published by a given pubkey */
export function useMyMagazines(pubkey: string | undefined) {
  const { nostr } = useNostr();
  return useQuery<NostrEvent[]>({
    queryKey: ['pressstr', 'my-magazines', pubkey],
    enabled: Boolean(pubkey),
    queryFn: async (c) => {
      if (!pubkey) return [];
      return nostr.query(
        [{ kinds: [KIND_MAGAZINE], authors: [pubkey], limit: 100 }],
        { signal: c.signal },
      );
    },
  });
}
