import { nip19 } from 'nostr-tools';

/**
 * Build the human-readable blog post URL from a pubkey and d-tag slug.
 * Format: /blog/:npub/:slug
 *
 * e.g. /blog/npub1marc.../my-awesome-post
 */
export function blogPostUrl(pubkey: string, slug: string): string {
  const npub = nip19.npubEncode(pubkey);
  return `/blog/${npub}/${slug}`;
}

/**
 * Build the edit URL for a blog post using its naddr.
 */
export function blogEditUrl(naddr: string): string {
  return `/edit/blog/${naddr}`;
}
