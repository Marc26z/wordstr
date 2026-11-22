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
import { ArrowLeft, Calendar, Headphones, MoreHorizontal, Pencil, User, Zap } from 'lucide-react';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { ZapDialog } from '@/components/ZapDialog';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { PromoVideo } from '@/components/PromoVideo';
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
  const promoVideo = getTag(event, 'video');
  const publishedAt = getTag(event, 'published_at');
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);

  const authorMeta = author.data?.metadata;
  const authorName = authorMeta?.name ?? genUserName(event.pubkey);
  const authorPicture = authorMeta?.picture;
  const authorNpub = nip19.npubEncode(event.pubkey);
  const isOwner = user?.pubkey === event.pubkey;

  // Boris (read.withboris.com) deep link — opens this article in the Boris
  // reader with TTS. The naddr carries relay hints (Boris follows them) so
  // the event can be found even on relays outside Boris's default set.
  const borisUrl = `https://read.withboris.com/a/${nip19.naddrEncode({
    kind: KIND_BLOG_POST,
    pubkey: event.pubkey,
    identifier: getTag(event, 'd') ?? '',
    relays: ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net'],
  })}`;

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
          <a
            href={borisUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Boris to listen with text-to-speech"
          >
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Headphones className="w-4 h-4" />
              <span className="hidden sm:inline">Boris</span>
            </Button>
          </a>
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
          <div className="mb-8 rounded-2xl overflow-hidden aspect-video w-full">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Promo video */}
        {promoVideo && (
          <div className="mb-8">
            <PromoVideo url={promoVideo} />
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
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center ring-2 ring-purple-500/20 group-hover:ring-purple-500/50 transition-all">
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

        {/* ── Markdown content ── */}
        <div className="rounded-2xl p-6 sm:p-10 shadow-xl bg-card text-card-foreground dark:bg-[#0d0a14] dark:text-[#f5f3ff]">
          {event.content ? (
            <div className="text-[1.0625rem] leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-foreground dark:text-white text-[2rem] font-extrabold mb-5 leading-tight">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-foreground dark:text-white text-2xl font-bold mt-10 mb-4 pb-2 border-b border-border dark:border-white/10 leading-snug">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-purple-700 dark:text-[#e9d5ff] text-xl font-bold mt-8 mb-3 leading-snug">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-purple-600 dark:text-[#ddd6fe] text-lg font-semibold mt-6 mb-2">{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground dark:text-[#ede9fe] mb-5 leading-relaxed">{children}</p>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-[#a78bfa] no-underline hover:underline">
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-foreground dark:text-white font-bold">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-purple-600 dark:text-[#ddd6fe] italic">{children}</em>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) return (
                      <code className="text-purple-600 dark:text-[#c4b5fd] block">{children}</code>
                    );
                    return (
                      <code className="text-purple-600 dark:text-[#c4b5fd] bg-purple-100 dark:bg-white/[0.08] px-1 py-0.5 rounded text-sm">{children}</code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted dark:bg-black/50 border border-border dark:border-white/[0.08] rounded-xl p-5 overflow-x-auto my-6 text-sm leading-relaxed">{children}</pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-600 pl-4 my-6 text-muted-foreground dark:text-white/65 bg-purple-50 dark:bg-white/[0.04] rounded-r-lg py-3 px-4">{children}</blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-muted-foreground dark:text-[#ede9fe] pl-6 my-4 mb-5 list-disc">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-muted-foreground dark:text-[#ede9fe] pl-6 my-4 mb-5 list-decimal">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-muted-foreground dark:text-[#ede9fe] mb-1.5">{children}</li>
                  ),
                  hr: () => (
                    <hr className="border-t border-border dark:border-white/10 my-10" />
                  ),
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt ?? ''} className="rounded-xl max-w-full my-6 shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]" />
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-6">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="text-foreground dark:text-white bg-purple-100 dark:bg-white/[0.08] px-4 py-2.5 text-left font-semibold border-b border-border dark:border-white/[0.15]">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="text-muted-foreground dark:text-[#ede9fe] px-4 py-2.5 border-b border-border dark:border-white/[0.06]">{children}</td>
                  ),
                }}
              >
                {event.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground italic">This post has no content.</p>
          )}
        </div>

        {/* Zap the author */}
        {user && !isOwner && (authorMeta?.lud16 || authorMeta?.lud06) && (
          <div className="mt-12 rounded-2xl border border-purple-200 bg-purple-50/60 dark:border-purple-800/40 dark:bg-purple-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold flex items-center justify-center sm:justify-start gap-2">
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Enjoyed this post?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Send {authorName} some sats to show your support.
              </p>
            </div>
            <ZapDialog target={event}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 whitespace-nowrap shadow-md shadow-purple-500/20">
                <Zap className="w-4 h-4" />
                Zap the author
              </Button>
            </ZapDialog>
          </div>
        )}

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
              <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center ring-2 ring-purple-500/30">
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
