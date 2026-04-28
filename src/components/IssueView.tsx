import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { genUserName } from '@/lib/genUserName';
import { ArrowLeft, ExternalLink, FileText, Newspaper, Calendar, MoreHorizontal, Pencil } from 'lucide-react';
import { DownloadButton } from '@/components/DownloadButton';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { KIND_MAGAZINE, formatFileSize } from '@/lib/pressstr';

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

interface IssueViewProps {
  event: NostrEvent;
  /** The naddr string used in the current URL, needed to build the edit link */
  naddr: string;
}

export function IssueView({ event, naddr }: IssueViewProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const author = useAuthor(event.pubkey);

  const title = getTag(event, 'title') ?? 'Untitled Issue';
  const issue = getTag(event, 'issue') ?? '';
  const image = getTag(event, 'image');
  const fileUrl = getTag(event, 'url') ?? '';
  const mimeType = getTag(event, 'm') ?? 'application/pdf';
  const fileSize = getTag(event, 'size');
  const summary = getTag(event, 'summary');
  const content = event.content;
  const publishedAt = getTag(event, 'published_at');
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);
  const magCoord = getTag(event, 'a') ?? '';

  const magCoordParts = magCoord.split(':');
  const magPubkey = magCoordParts[1] ?? '';
  const magD = magCoordParts[2] ?? '';

  const { data: magazineEvent } = useQuery<NostrEvent | undefined>({
    queryKey: ['pressstr', 'magazine', magPubkey, magD],
    enabled: Boolean(magPubkey && magD),
    queryFn: async (c) => {
      if (!magPubkey || !magD) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_MAGAZINE], authors: [magPubkey], '#d': [magD], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });

  const magazineTitle = magazineEvent?.tags.find(([n]) => n === 'title')?.[1] ?? 'Magazine';
  const magazineNaddr = magazineEvent
    ? nip19.naddrEncode({ kind: KIND_MAGAZINE, pubkey: magPubkey, identifier: magD })
    : null;

  const authorName = author.data?.metadata?.name ?? genUserName(event.pubkey);
  const authorNpub = nip19.npubEncode(event.pubkey);
  const isEpub = mimeType.includes('epub');
  const format = isEpub ? 'EPUB' : 'PDF';
  const isOwner = user?.pubkey === event.pubkey;

  const publishedDate = publishedAt
    ? new Date(Number(publishedAt) * 1000).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const backTo = magazineNaddr ? `/${magazineNaddr}` : '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backTo}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          {magazineNaddr && (
            <Link to={backTo} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Newspaper className="w-4 h-4" />
              <span>{magazineTitle}</span>
            </Link>
          )}
          <div className="flex-1" />
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Issue options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/edit/issue/${naddr}`} className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit issue
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="p-0"
                  onSelect={(e) => e.preventDefault()}
                >
                  <DeleteEventButton
                    event={event}
                    redirectTo={magazineNaddr ? `/${magazineNaddr}` : '/'}
                    label="Delete issue"
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-48 md:w-56 rounded-xl shadow-lg border object-cover aspect-[2/3]"
              />
            ) : (
              <div className="w-48 md:w-56 aspect-[2/3] rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 flex items-center justify-center border">
                <Newspaper className="w-16 h-16 text-blue-400" />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            {issue && <p className="text-sm font-medium text-primary mb-1">{issue}</p>}
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              <Link to={`/${authorNpub}`} className="hover:text-foreground transition-colors">
                {authorName}
              </Link>
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {publishedDate}
                </span>
              )}
              <Badge variant="outline" className="text-xs">{format}</Badge>
              {fileSize && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {formatFileSize(Number(fileSize))}
                </span>
              )}
            </div>

            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}

            {summary && <p className="text-muted-foreground mb-4">{summary}</p>}

            {fileUrl && (
              <div className="flex flex-wrap gap-3">
                <DownloadButton
                  url={fileUrl}
                  filename={`${title}.${isEpub ? 'epub' : 'pdf'}`}
                  label={`Download ${format}`}
                />
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in browser
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        {content && (
          <div className="mt-10 prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap border-t pt-8">
            {content}
          </div>
        )}

        {/* Comments */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-6">Comments</h2>
          <CommentsSection
            root={event}
            emptyStateMessage="No comments yet"
            emptyStateSubtitle="Be the first to comment on this issue."
          />
        </div>
      </div>
    </div>
  );
}
