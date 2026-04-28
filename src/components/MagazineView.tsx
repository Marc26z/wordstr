import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IssueCard } from '@/components/PublicationCard';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { useAuthor } from '@/hooks/useAuthor';
import { useMagazineIssues } from '@/hooks/useMagazines';
import { genUserName } from '@/lib/genUserName';
import { ArrowLeft, Globe, Newspaper, Plus, ExternalLink, MoreHorizontal, Pencil } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { KIND_MAGAZINE } from '@/lib/pressstr';

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

interface MagazineViewProps {
  event: NostrEvent;
  naddr: string;
}

export function MagazineView({ event, naddr }: MagazineViewProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(event.pubkey);
  const dTag = getTag(event, 'd') ?? '';
  const coord = `${KIND_MAGAZINE}:${event.pubkey}:${dTag}`;
  const { data: issues, isLoading: issuesLoading } = useMagazineIssues(coord);

  const title = getTag(event, 'title') ?? 'Untitled Magazine';
  const image = getTag(event, 'image');
  const summary = getTag(event, 'summary');
  const websiteUrl = getTag(event, 'url');
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);
  const content = event.content;

  const authorName = author.data?.metadata?.name ?? genUserName(event.pubkey);
  const authorNpub = nip19.npubEncode(event.pubkey);

  const isOwner = user?.pubkey === event.pubkey;
  const issuePublishUrl = `/publish/issue?magazine=${encodeURIComponent(coord)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Newspaper className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Magazine</span>
          <div className="flex-1" />
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Magazine options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/edit/magazine/${naddr}`} className="flex items-center">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit magazine
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <DeleteEventButton event={event} redirectTo="/" label="Delete magazine" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Magazine header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10">
          {image && (
            <div className="flex-shrink-0">
              <img
                src={image}
                alt={title}
                className="w-full sm:w-48 h-32 sm:h-32 object-contain rounded-xl border bg-muted"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {summary && <p className="text-muted-foreground mb-3">{summary}</p>}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              <Link to={`/${authorNpub}`} className="hover:text-foreground transition-colors">
                by {authorName}
              </Link>
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}
          </div>
          {isOwner && (
            <div className="flex-shrink-0 flex gap-2">
              <Link to={`/edit/magazine/${naddr}`}>
                <Button size="sm" variant="outline">
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
              </Link>
              <Link to={issuePublishUrl}>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Issue
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Description */}
        {content && (
          <div className="prose prose-sm dark:prose-invert max-w-none mb-10 text-muted-foreground whitespace-pre-wrap">
            {content}
          </div>
        )}

        {/* Issues */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Issues
            {issues && issues.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({issues.length})
              </span>
            )}
          </h2>

          {issuesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[2/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : issues && issues.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {issues.map((issue) => (
                <IssueCard key={issue.id} event={issue} />
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-xl p-12 text-center">
              <Newspaper className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No issues yet.</p>
              {isOwner && (
                <Link to={issuePublishUrl}>
                  <Button size="sm" className="mt-4">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Publish First Issue
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
