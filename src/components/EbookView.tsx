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
import { genUserName } from '@/lib/genUserName';
import { ArrowLeft, BookOpen, ExternalLink, FileText, Calendar, Globe, MoreHorizontal, Pencil } from 'lucide-react';
import { DownloadButton } from '@/components/DownloadButton';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { formatFileSize } from '@/lib/pressstr';

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

interface EbookViewProps {
  event: NostrEvent;
  /** The naddr string used in the current URL, needed to build the edit link */
  naddr: string;
}

export function EbookView({ event, naddr }: EbookViewProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(event.pubkey);

  const title = getTag(event, 'title') ?? 'Untitled Ebook';
  const image = getTag(event, 'image');
  const fileUrl = getTag(event, 'url') ?? '';
  const mimeType = getTag(event, 'm') ?? 'application/pdf';
  const fileSize = getTag(event, 'size');
  const summary = getTag(event, 'summary');
  const content = event.content;
  const publishedAt = getTag(event, 'published_at');
  const language = getTag(event, 'l');
  const isbn = getTag(event, 'isbn');
  const authors = event.tags.filter(([n]) => n === 'author').map(([, v]) => v);
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);

  const authorName = author.data?.metadata?.name ?? genUserName(event.pubkey);
  const authorNpub = nip19.npubEncode(event.pubkey);
  const isEpub = mimeType.includes('epub');
  const format = isEpub ? 'EPUB' : 'PDF';
  const isOwner = user?.pubkey === event.pubkey;

  const publishedDate = publishedAt
    ? new Date(Number(publishedAt) * 1000).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long',
      })
    : null;

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
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ebook</span>
          <div className="flex-1" />
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Ebook options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/edit/ebook/${naddr}`} className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit ebook
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="p-0"
                  onSelect={(e) => e.preventDefault()}
                >
                  <DeleteEventButton
                    event={event}
                    redirectTo="/"
                    label="Delete ebook"
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
                className="w-40 md:w-52 rounded-xl shadow-lg border object-cover aspect-[2/3]"
              />
            ) : (
              <div className="w-40 md:w-52 aspect-[2/3] rounded-xl bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/30 dark:to-pink-800/30 flex items-center justify-center border">
                <BookOpen className="w-16 h-16 text-purple-400" />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>

            {authors.length > 0 && (
              <p className="text-lg text-muted-foreground mb-3">
                by {authors.join(', ')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              <Link to={`/${authorNpub}`} className="hover:text-foreground transition-colors">
                Published by {authorName}
              </Link>
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {publishedDate}
                </span>
              )}
              {language && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {language.toUpperCase()}
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

            {isbn && (
              <p className="text-xs text-muted-foreground mb-3">ISBN: {isbn}</p>
            )}

            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}

            {summary && (
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{summary}</p>
            )}

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
            emptyStateSubtitle="Be the first to comment on this ebook."
          />
        </div>
      </div>
    </div>
  );
}
