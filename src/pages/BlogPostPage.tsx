import { useParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogPostView } from '@/components/BlogPostView';
import { KIND_BLOG_POST } from '@/hooks/useBlogs';
import NotFound from './NotFound';

function LoadingPage() {
  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="w-full aspect-video rounded-2xl" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <div className="flex gap-3 items-center">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * BlogPostPage — handles /blog/:npub/:slug
 *
 * Decodes the npub to a hex pubkey, then queries Nostr for the kind 30023
 * event with that pubkey and d-tag slug. Renders BlogPostView on success.
 */
export function BlogPostPage() {
  const { npub, slug } = useParams<{ npub: string; slug: string }>();
  const { nostr } = useNostr();

  // Decode npub → hex pubkey
  let pubkey: string | null = null;
  if (npub) {
    try {
      const decoded = nip19.decode(npub);
      if (decoded.type === 'npub') pubkey = decoded.data;
    } catch {
      // fall through to NotFound
    }
  }

  const { data: event, isLoading, isError } = useQuery<NostrEvent | undefined>({
    queryKey: ['blog-post', pubkey, slug],
    enabled: Boolean(pubkey && slug),
    queryFn: async (c) => {
      if (!pubkey || !slug) return undefined;
      const events = await nostr.query(
        [{
          kinds: [KIND_BLOG_POST],
          authors: [pubkey],
          '#d': [slug],
          limit: 1,
        }],
        { signal: c.signal },
      );
      return events[0];
    },
  });

  if (!pubkey || !slug) return <NotFound />;
  if (isLoading) return <LoadingPage />;
  if (isError || !event) return <NotFound />;

  // Build the naddr for the edit link (still needed internally)
  const naddr = nip19.naddrEncode({
    kind: KIND_BLOG_POST,
    pubkey,
    identifier: slug,
  });

  return <BlogPostView event={event} naddr={naddr} />;
}
