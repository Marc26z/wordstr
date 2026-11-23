import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  eventCoordinate,
  KIND_CLASSIFIED_LISTING,
  listingIsForCoordinate,
  saleListingD,
} from '@/lib/nip99';

/**
 * Find the NIP-99 (kind 30402) sale listing attached to any addressable event.
 *
 * Works for ebooks, magazine issues, magazines and blog posts. Events without
 * a listing remain free to access.
 */
export function useSaleListing(event: NostrEvent | undefined) {
  const { nostr } = useNostr();
  const coordinate = event ? eventCoordinate(event) : null;
  const d = event?.tags.find(([n]) => n === 'd')?.[1];
  const listingD = event && d ? saleListingD(event.kind, d) : null;

  return useQuery<NostrEvent | undefined>({
    queryKey: ['nip99', 'sale-listing', event?.pubkey ?? '', event?.kind ?? 0, listingD ?? ''],
    enabled: Boolean(event && coordinate && d && listingD),
    queryFn: async (c) => {
      if (!event || !coordinate || !d || !listingD) return undefined;

      const events = await nostr.query(
        [
          {
            kinds: [KIND_CLASSIFIED_LISTING],
            authors: [event.pubkey],
            '#a': [coordinate],
            limit: 10,
          },
          {
            kinds: [KIND_CLASSIFIED_LISTING],
            authors: [event.pubkey],
            '#d': [listingD],
            limit: 10,
          },
        ],
        { signal: c.signal },
      );

      const newestFirst = [...events].sort((a, b) => b.created_at - a.created_at);
      return newestFirst.find((candidate) => listingIsForCoordinate(candidate, coordinate))
        ?? newestFirst.find((candidate) => candidate.tags.some(([n, value]) => n === 'd' && value === listingD));
    },
    staleTime: 60_000,
  });
}
