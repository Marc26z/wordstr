import type { NostrEvent } from '@nostrify/nostrify';
import { KIND_BLOG_POST } from '@/hooks/useBlogs';
import { KIND_EBOOK, KIND_MAGAZINE, KIND_MAGAZINE_ISSUE } from '@/lib/pressstr';

/** NIP-99 Classified Listing — an addressable event describing an item for sale. */
export const KIND_CLASSIFIED_LISTING = 30402;

/** Read a tag value from a Nostr event. */
export function getEventTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

/** Build the addressable coordinate (`kind:pubkey:d`) for an event. */
export function eventCoordinate(event: NostrEvent): string | null {
  const d = getEventTag(event, 'd');
  if (!d) return null;
  return `${event.kind}:${event.pubkey}:${d}`;
}

/**
 * Build the `d` tag for a sale listing.
 *
 * Ebooks keep their original unprefixed identifier for backwards
 * compatibility with existing listings. Other product kinds are namespaced so
 * a blog post, magazine and ebook with the same slug do not overwrite each
 * other's listing.
 */
export function saleListingD(kind: number, productD: string): string {
  switch (kind) {
    case KIND_EBOOK:
      return productD;
    case KIND_MAGAZINE:
      return `magazine:${productD}`;
    case KIND_MAGAZINE_ISSUE:
      return `issue:${productD}`;
    case KIND_BLOG_POST:
      return `blog:${productD}`;
    default:
      return `${kind}:${productD}`;
  }
}

/**
 * Extract the price in satoshis from a NIP-99 `price` tag.
 *
 * wordstr writes prices as `["price", "<sats>", "SAT"]`. A zero or missing
 * price means the item is free. A `sold` status deactivates the listing.
 */
export function parsePriceSats(event: NostrEvent): number {
  const status = getEventTag(event, 'status');
  if (status === 'sold' || status === 'inactive') return 0;

  const price = event.tags.find(([n]) => n === 'price');
  if (!price) return 0;

  const amount = Number(price[1]);
  const currency = (price[2] ?? '').toLowerCase();
  if ((currency !== 'sat' && currency !== 'sats') || !Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  return Math.floor(amount);
}

/** Whether a NIP-99 listing points at the given addressable event. */
export function listingIsForCoordinate(listing: NostrEvent, coordinate: string): boolean {
  return listing.tags.some(([n, value]) => n === 'a' && value === coordinate);
}
