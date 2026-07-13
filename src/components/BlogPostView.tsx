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
          <div className="mb-8 rounded-2xl overflow-hidden aspect-video w-full">
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

        {/* ── Markdown content — always dark, always white text ── */}
        <div
          className="rounded-2xl p-6 sm:p-10 shadow-xl"
          style={{ background: '#0d0a14', boxShadow: '0 8px 40px rgba(109,40,217,0.15)' }}
        >
          {event.content ? (
            <div
              className="wordstr-blog-body"
              style={{
                color: '#f5f3ff',
                fontSize: '1.0625rem',
                lineHeight: '1.8',
                fontFamily: 'inherit',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: '0 0 1.25rem', lineHeight: 1.2 }}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '2.5rem 0 1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.3 }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 style={{ color: '#e9d5ff', fontSize: '1.25rem', fontWeight: 700, margin: '2rem 0 0.75rem', lineHeight: 1.3 }}>{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 style={{ color: '#ddd6fe', fontSize: '1.1rem', fontWeight: 600, margin: '1.5rem 0 0.5rem' }}>{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p style={{ color: '#ede9fe', margin: '0 0 1.25rem', lineHeight: 1.8 }}>{children}</p>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none' }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                    >{children}</a>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: '#fff', fontWeight: 700 }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ color: '#ddd6fe', fontStyle: 'italic' }}>{children}</em>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) return (
                      <code style={{ color: '#c4b5fd', display: 'block' }}>{children}</code>
                    );
                    return (
                      <code style={{ color: '#c4b5fd', background: 'rgba(255,255,255,0.08)', padding: '0.15em 0.4em', borderRadius: '4px', fontSize: '0.875em' }}>{children}</code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', overflowX: 'auto', margin: '1.5rem 0', fontSize: '0.875rem', lineHeight: 1.6 }}>{children}</pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote style={{ borderLeft: '3px solid #7c3aed', paddingLeft: '1rem', margin: '1.5rem 0', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.04)', borderRadius: '0 8px 8px 0', padding: '0.75rem 1rem' }}>{children}</blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ color: '#ede9fe', paddingLeft: '1.5rem', margin: '1rem 0 1.25rem', listStyleType: 'disc' }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ color: '#ede9fe', paddingLeft: '1.5rem', margin: '1rem 0 1.25rem', listStyleType: 'decimal' }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ color: '#ede9fe', marginBottom: '0.35rem' }}>{children}</li>
                  ),
                  hr: () => (
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2.5rem 0' }} />
                  ),
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt ?? ''} style={{ borderRadius: '12px', maxWidth: '100%', margin: '1.5rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }} />
                  ),
                  table: ({ children }) => (
                    <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th style={{ color: '#fff', background: 'rgba(255,255,255,0.08)', padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td style={{ color: '#ede9fe', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{children}</td>
                  ),
                }}
              >
                {event.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>This post has no content.</p>
          )}
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
