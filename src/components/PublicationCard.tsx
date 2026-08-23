import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Newspaper } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

interface MagazineCardProps {
  event: NostrEvent;
}

export function MagazineCard({ event }: MagazineCardProps) {
  const title = getTag(event, 'title') ?? 'Untitled Magazine';
  const image = getTag(event, 'image');
  const summary = getTag(event, 'summary');
  const dTag = getTag(event, 'd') ?? '';
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);

  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: dTag,
  });

  return (
    <Link to={`/${naddr}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
        <div className="aspect-[3/2] bg-muted overflow-hidden relative">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
              <Newspaper className="w-12 h-12 text-amber-600 dark:text-amber-400" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-2">{title}</h3>
          {summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{summary}</p>
          )}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topics.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface IssueCardProps {
  event: NostrEvent;
}

export function IssueCard({ event }: IssueCardProps) {
  const title = getTag(event, 'title') ?? 'Untitled Issue';
  const image = getTag(event, 'image');
  const issue = getTag(event, 'issue') ?? '';
  const summary = getTag(event, 'summary');
  const dTag = getTag(event, 'd') ?? '';

  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: dTag,
  });

  return (
    <Link to={`/${naddr}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
        <div className="aspect-[2/3] bg-muted overflow-hidden relative">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
              <Newspaper className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          {issue && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <span className="text-white text-xs font-medium">{issue}</span>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{title}</h3>
          {summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{summary}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface EbookCardProps {
  event: NostrEvent;
}

export function EbookCard({ event }: EbookCardProps) {
  const title = getTag(event, 'title') ?? 'Untitled Ebook';
  const image = getTag(event, 'image');
  const summary = getTag(event, 'summary');
  const dTag = getTag(event, 'd') ?? '';
  const authors = event.tags.filter(([n]) => n === 'author').map(([, v]) => v);
  const mimeType = getTag(event, 'm') ?? '';
  const format = mimeType.includes('epub') ? 'EPUB' : 'PDF';
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);

  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: dTag,
  });

  return (
    <Link to={`/${naddr}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
        <div className="aspect-[2/3] bg-muted overflow-hidden relative">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
              <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge className="text-xs bg-black/60 text-white border-0">{format}</Badge>
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{title}</h3>
          {authors.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {authors.join(', ')}
            </p>
          )}
          {summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{summary}</p>
          )}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {topics.slice(0, 2).map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
