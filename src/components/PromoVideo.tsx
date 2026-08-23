import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Film } from 'lucide-react';

interface ParsedPromoUrl {
  /** Direct video file URL if the pasted link already points to one. */
  directVideoUrl?: string;
  /** Divine video event ID (hex) extracted from a divine.video/video/:id link. */
  divineVideoId?: string;
  /** The original URL for fallback linking. */
  originalUrl: string;
}

const VIDEO_FILE_RE = /\.(mp4|webm|mov|m4v|ogv)(?:$|\?)/i;
const DIVINE_VIDEO_RE = /^https?:\/\/(?:www\.)?divine\.video\/video\/([a-f0-9]{64})/i;

function parsePromoUrl(url: string): ParsedPromoUrl {
  const trimmed = url.trim();
  if (!trimmed) return { originalUrl: trimmed };

  if (VIDEO_FILE_RE.test(trimmed)) {
    return { originalUrl: trimmed, directVideoUrl: trimmed };
  }

  const divineMatch = trimmed.match(DIVINE_VIDEO_RE);
  if (divineMatch) {
    return { originalUrl: trimmed, divineVideoId: divineMatch[1] };
  }

  return { originalUrl: trimmed };
}

function getImetaVideoUrl(event: NostrEvent): string | undefined {
  const imeta = event.tags.find(([n]) => n === 'imeta');
  if (!imeta) return undefined;

  // imeta tag shape: ['imeta', 'url https://…', 'm video/mp4', ...]
  const urlPart = imeta.slice(1).find((part) => part.startsWith('url '));
  return urlPart?.slice(4).trim();
}

function getImetaImageUrl(event: NostrEvent): string | undefined {
  const imeta = event.tags.find(([n]) => n === 'imeta');
  if (!imeta) return undefined;

  const imagePart = imeta.slice(1).find((part) => part.startsWith('image '));
  return imagePart?.slice(6).trim();
}

function useDivineVideo(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent | undefined>({
    queryKey: ['divine-video', eventId],
    enabled: Boolean(eventId),
    queryFn: async (c) => {
      if (!eventId) return undefined;
      const relay = nostr.relay('wss://relay.divine.video');
      const events = await relay.query([{ ids: [eventId] }], { signal: c.signal });
      return events[0];
    },
  });
}

interface PromoVideoProps {
  url: string;
}

/**
 * Renders a promotional video for a blog post.
 *
 * Supports:
 * - Direct video file URLs (mp4, webm, mov, etc.)
 * - Divine video page links (https://divine.video/video/<event-id>) — resolves
 *   the kind 34236 event from the Divine relay and plays the imeta video URL.
 */
export function PromoVideo({ url }: PromoVideoProps) {
  const parsed = useMemo(() => parsePromoUrl(url), [url]);
  const { data: divineEvent, isLoading } = useDivineVideo(parsed.divineVideoId);

  const videoUrl = parsed.directVideoUrl ?? (divineEvent ? getImetaVideoUrl(divineEvent) : undefined);
  const posterUrl = divineEvent ? getImetaImageUrl(divineEvent) : undefined;

  if (parsed.divineVideoId && isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden border bg-card">
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
          <Film className="w-6 h-6 text-purple-500" />
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Promo video link
        </p>
        <a
          href={parsed.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          Watch on Divine
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border bg-black shadow-lg">
      <video
        controls
        playsInline
        preload="metadata"
        poster={posterUrl}
        className="w-full aspect-video bg-black"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
