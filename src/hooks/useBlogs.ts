import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { SITE_OWNER_PUBKEY } from '@/lib/siteOwner';
import { useOwnerWriteRelays } from '@/hooks/useOwnerWriteRelays';

export const KIND_BLOG_POST = 30023;

/**
 * Fetch the site owner's recent blog posts (kind 30023).
 * Queries the owner's NIP-65 write relays (outbox model) plus the app
 * defaults, so posts show up completely and consistently.
 */
export function useBlogs(limit = 50) {
  const { nostr } = useNostr();
  const { data: relayUrls } = useOwnerWriteRelays();

  return useQuery<NostrEvent[]>({
    queryKey: ['wordstr', 'blogs', limit, relayUrls],
    enabled: Boolean(relayUrls),
    queryFn: async (c) =>
      nostr.group(relayUrls ?? []).query(
        [{ kinds: [KIND_BLOG_POST], authors: [SITE_OWNER_PUBKEY], limit }],
        { signal: c.signal },
      ),
  });
}

/** Fetch all blog posts by a specific author */
export function useAuthorBlogs(pubkey: string | undefined) {
  const { nostr } = useNostr();
  return useQuery<NostrEvent[]>({
    queryKey: ['wordstr', 'author-blogs', pubkey],
    enabled: Boolean(pubkey),
    queryFn: async (c) => {
      if (!pubkey) return [];
      const events = await nostr.query(
        [{ kinds: [KIND_BLOG_POST], authors: [pubkey], limit: 200 }],
        { signal: c.signal },
      );
      // Sort newest first
      return events.sort((a, b) => {
        const aAt = Number(a.tags.find(([n]) => n === 'published_at')?.[1] ?? a.created_at);
        const bAt = Number(b.tags.find(([n]) => n === 'published_at')?.[1] ?? b.created_at);
        return bAt - aAt;
      });
    },
  });
}

/** Fetch a single blog post by author + d tag */
export function useBlogPost(pubkey: string | undefined, dTag: string | undefined) {
  const { nostr } = useNostr();
  return useQuery<NostrEvent | undefined>({
    queryKey: ['wordstr', 'blog-post', pubkey, dTag],
    enabled: Boolean(pubkey && dTag),
    queryFn: async (c) => {
      if (!pubkey || !dTag) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_BLOG_POST], authors: [pubkey], '#d': [dTag], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });
}
