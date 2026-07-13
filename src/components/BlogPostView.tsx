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
import { ArrowLeft, Calendar, MoreHorizontal, Pencil, User } from 'lucide-react';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { KIND_BLOG_POST } from '@/hooks/useBlogs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

interface BlogPostViewProps {
  event: NostrEvent;
  naddr: string;
}

export function BlogPostView({ event, naddr }: BlogPostViewProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(event.pubkey);

  const title = getTag(event, 'title') ?? 'Untitled';
  const image = getTag(event, 'image');
  const summary = getTag(event, 'summary');
  const publishedAt = getTag(event, 'published_at');
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);

  const authorMeta = author.data?.metadata;
  const authorName = authorMeta?.name ?? genUserName(event.pubkey);
  const authorPicture = authorMeta?.picture;
  const authorNpub = nip19.npubEncode(event.pubkey);
  const isOwner = user?.pubkey === event.pubkey;

  const publishedDate = publishedAt
    ? new Date(Number(publishedAt) * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(event.created_at * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const editNaddr = nip19.naddrEncode({
    kind: KIND_BLOG_POST,
    pubkey: event.pubkey,
    identifier: getTag(event, 'd') ?? '',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky nav */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Link
            to={`/${authorNpub}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
          >
            {authorName}'s blog
          </Link>
          <div className="flex-1" />
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Post options">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/edit/blog/${naddr}`} className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit post
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-0" onSelect={(e) => e.preventDefault()}>
                  <DeleteEventButton event={event} redirectTo="/" label="Delete post" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero image */}
        {image && (
          <div className="mb-8 rounded-2xl overflow-hidden aspect-video">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title & meta */}
        <header className="mb-8">
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topics.map((t) => (
                <Badge
                  key={t}
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60 border-0 text-xs"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            {title}
          </h1>

          {summary && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {summary}
            </p>
          )}

          {/* Author & date row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link to={`/${authorNpub}`} className="flex items-center gap-2.5 group">
              {authorPicture ? (
                <img
                  src={authorPicture}
                  alt={authorName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/20 group-hover:ring-purple-500/50 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center ring-2 ring-purple-500/20 group-hover:ring-purple-500/50 transition-all">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-sm font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {authorName}
              </span>
            </Link>
            <span className="text-muted-foreground/50">·</span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {publishedDate}
            </span>
          </div>
        </header>

        {/* Divider */}
        <div className="border-t mb-8" />

        {/* Markdown content — always dark mode styled */}
        <div className="dark">
          <div className="rounded-2xl bg-[#0d0a14] p-6 sm:p-10 shadow-xl shadow-purple-900/20">
            {event.content ? (
              <article className="prose prose-invert prose-purple max-w-none
                prose-headings:font-extrabold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-6
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:leading-relaxed prose-p:text-white/85
                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:text-violet-300 hover:prose-a:underline
                prose-strong:text-white prose-strong:font-semibold
                prose-em:text-purple-200
                prose-code:text-violet-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-5
                prose-blockquote:border-l-violet-500 prose-blockquote:text-white/70 prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
                prose-img:rounded-xl prose-img:shadow-lg
                prose-hr:border-white/10
                prose-ul:text-white/85 prose-ol:text-white/85
                prose-li:marker:text-purple-400
                prose-table:text-sm
                prose-th:text-white/90 prose-th:bg-white/10
                prose-td:text-white/80
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {event.content}
                </ReactMarkdown>
              </article>
            ) : (
              <p className="text-white/40 italic">This post has no content.</p>
            )}
          </div>
        </div>

        {/* Author card */}
        <div className="mt-12 rounded-2xl border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link to={`/${authorNpub}`} className="flex-shrink-0">
            {authorPicture ? (
              <img
                src={authorPicture}
                alt={authorName}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-500/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center ring-2 ring-purple-500/30">
                <User className="w-7 h-7 text-white" />
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={`/${authorNpub}`}
              className="font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {authorName}
            </Link>
            {authorMeta?.about && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {authorMeta.about}
              </p>
            )}
          </div>
          <Link to={`/${authorNpub}`}>
            <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 whitespace-nowrap">
              View all posts
            </Button>
          </Link>
        </div>

        {/* Comments */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-6">Comments</h2>
          <CommentsSection
            root={event}
            emptyStateMessage="No comments yet"
            emptyStateSubtitle="Be the first to share your thoughts on this post."
          />
        </div>
      </article>
    </div>
  );
}
