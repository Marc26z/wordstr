import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import NotFound from './NotFound';
import { Skeleton } from '@/components/ui/skeleton';
import { MagazineView } from '@/components/MagazineView';
import { IssueView } from '@/components/IssueView';
import { EbookView } from '@/components/EbookView';
import { KIND_MAGAZINE, KIND_MAGAZINE_ISSUE, KIND_EBOOK } from '@/lib/pressstr';

function LoadingPage() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-5xl mx-auto">
      <div className="flex gap-8">
        <Skeleton className="w-48 h-72 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-4 pt-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type } = decoded;

  switch (type) {
    case 'npub':
    case 'nprofile':
      return <div className="p-8 text-center text-muted-foreground">Profile view coming soon.</div>;

    case 'note':
      return <div className="p-8 text-center text-muted-foreground">Note view coming soon.</div>;

    case 'nevent':
      return <div className="p-8 text-center text-muted-foreground">Event view coming soon.</div>;

    case 'naddr':
      return <NaddrView data={decoded.data} naddr={identifier} />;

    default:
      return <NotFound />;
  }
}

interface NaddrData {
  kind: number;
  pubkey: string;
  identifier: string;
  relays?: string[];
}

function NaddrView({ data, naddr }: { data: NaddrData; naddr: string }) {
  const { nostr } = useNostr();

  const { data: event, isLoading, isError } = useQuery<NostrEvent | undefined>({
    queryKey: ['naddr', data.kind, data.pubkey, data.identifier],
    queryFn: async (c) => {
      const events = await nostr.query(
        [{
          kinds: [data.kind],
          authors: [data.pubkey],
          '#d': [data.identifier],
          limit: 1,
        }],
        { signal: c.signal },
      );
      return events[0];
    },
  });

  if (isLoading) return <LoadingPage />;
  if (isError || !event) return <NotFound />;

  switch (data.kind) {
    case KIND_MAGAZINE:
      return <MagazineView event={event} naddr={naddr} />;
    case KIND_MAGAZINE_ISSUE:
      return <IssueView event={event} naddr={naddr} />;
    case KIND_EBOOK:
      return <EbookView event={event} naddr={naddr} />;
    default:
      return (
        <div className="p-8 text-center text-muted-foreground">
          Unknown event kind: {data.kind}
        </div>
      );
  }
}
