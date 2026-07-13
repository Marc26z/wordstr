import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { blogPostUrl } from '@/lib/blogUrl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthorBlogs } from '@/hooks/useBlogs';
import { genUserName } from '@/lib/genUserName';
import { ArrowLeft, Calendar, FileEdit, Globe, Plus, User } from 'lucide-react';

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

function BlogCard({ event }: { event: NostrEvent }) {
  const title = getTag(event, 'title') ?? 'Untitled';
  const image = getTag(event, 'image');
  const summary = getTag(event, 'summary');
  const publishedAt = getTag(event, 'published_at');
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);
  const dTag = getTag(event, 'd') ?? '';

  const postUrl = blogPostUrl(event.pubkey, dTag);

  const publishedDate = publishedAt
    ? new Date(Number(publishedAt) * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date(event.created_at * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

  return (
    <Link to={postUrl} className="group block">
      <article className="flex flex-col sm:flex-row gap-4 rounded-2xl border bg-card hover:border-purple-400/60 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 overflow-hidden p-0">
        {/* Thumbnail */}
        {image ? (
          <div className="sm:w-44 sm:h-32 flex-shrink-0 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-40 sm:h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="sm:w-44 sm:h-32 flex-shrink-0 bg-gradient-to-br from-violet-900/40 to-purple-800/40 flex items-center justify-center">
            <FileEdit className="w-8 h-8 text-purple-500/50" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base sm:text-lg leading-snug mb-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
              {title}
            </h2>
            {summary && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{summary}</p>
            )}
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {topics.slice(0, 4).map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {publishedDate}
          </span>
        </div>
      </article>
    </Link>
  );
}

interface BlogListPageProps {
  pubkey: string;
}

export function BlogListPage({ pubkey }: BlogListPageProps) {
  const author = useAuthor(pubkey);
  const { user } = useCurrentUser();
  const { data: posts, isLoading } = useAuthorBlogs(pubkey);

  const authorMeta = author.data?.metadata;
  const authorName = authorMeta?.name ?? genUserName(pubkey);
  const authorPicture = authorMeta?.picture;
  const authorBanner = authorMeta?.banner;
  const authorAbout = authorMeta?.about;
  const authorWebsite = authorMeta?.website;
  const authorNpub = nip19.npubEncode(pubkey);

  const isOwner = user?.pubkey === pubkey;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground font-medium truncate">{authorName}</span>
          <div className="flex-1" />
          {isOwner && (
            <Link to="/publish/blog">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Post</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Profile banner */}
      <div className="relative">
        {authorBanner ? (
          <div className="h-36 sm:h-48 overflow-hidden">
            <img
              src={authorBanner}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
          </div>
        ) : (
          <div className="h-24 sm:h-32 bg-gradient-to-br from-black via-purple-950 to-violet-900" />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Profile header */}
        <div className="-mt-10 sm:-mt-12 mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          {authorPicture ? (
            <img
              src={authorPicture}
              alt={authorName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-background shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center ring-4 ring-background shadow-lg flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{authorName}</h1>
            {authorAbout && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{authorAbout}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {authorWebsite && (
                <a
                  href={authorWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  {authorWebsite.replace(/^https?:\/\//, '')}
                </a>
              )}
              {posts && (
                <span className="text-xs text-muted-foreground">
                  {posts.length} post{posts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Posts list */}
        <div className="pb-16">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-purple-500" />
            Blog Posts
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 rounded-2xl border p-4">
                  <Skeleton className="w-44 h-28 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-1/4 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <BlogCard key={post.id} event={post} />
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-purple-200 dark:border-purple-900 rounded-2xl py-16 px-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                <FileEdit className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                {isOwner
                  ? 'Start writing your first blog post on Nostr.'
                  : `${authorName} hasn't published any blog posts yet.`}
              </p>
              {isOwner && (
                <Link to="/publish/blog">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Write Your First Post
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
