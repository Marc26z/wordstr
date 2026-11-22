import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { eventCoordinate, KIND_CLASSIFIED_LISTING, listingIsForEbook } from '@/lib/nip99';

/**
 * Find the NIP-99 (kind 30402) sale listing attached to an ebook, if any.
 * Ebooks without a listing remain free to download.
 */
export function useEbookListing(ebook: NostrEvent | undefined) {
  const { nostr } = useNostr();
  const coordinate = ebook ? eventCoordinate(ebook) : null;
  const d = ebook?.tags.find(([n]) => n === 'd')?.[1];

  return useQuery<NostrEvent | undefined>({
    queryKey: ['nip99', 'ebook-listing', ebook?.pubkey ?? '', d ?? ''],
    enabled: Boolean(ebook && coordinate && d),
    queryFn: async (c) => {
      if (!ebook || !coordinate || !d) return undefined;

      const events = await nostr.query(
        [
          {
            kinds: [KIND_CLASSIFIED_LISTING],
            authors: [ebook.pubkey],
            '#a': [coordinate],
            limit: 10,
          },
          {
            kinds: [KIND_CLASSIFIED_LISTING],
            authors: [ebook.pubkey],
            '#d': [d],
            limit: 10,
          },
        ],
        { signal: c.signal },
      );

      return events.find((event) => listingIsForEbook(event, coordinate)) ?? events[0];
    },
    staleTime: 60_000,
  });
}
