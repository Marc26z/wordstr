import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginArea } from '@/components/auth/LoginArea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MagazineCard, EbookCard } from '@/components/PublicationCard';
import { useMagazines, useEbooks } from '@/hooks/useMagazines';
import { useBlogs } from '@/hooks/useBlogs';
import { blogPostUrl } from '@/lib/blogUrl';
import { SITE_OWNER_PUBKEY } from '@/lib/siteOwner';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { BookOpen, Newspaper, Plus, PenLine, Sparkles, FileEdit, Calendar, User, FileStack } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

function BlogPreviewCard({ event }: { event: NostrEvent }) {
  const title = getTag(event, 'title') ?? 'Untitled';
  const image = getTag(event, 'image');
  const summary = getTag(event, 'summary');
  const publishedAt = getTag(event, 'published_at');
  const topics = event.tags.filter(([n]) => n === 't').map(([, v]) => v);
  const dTag = getTag(event, 'd') ?? '';
  const author = useAuthor(event.pubkey);
  const authorName = author.data?.metadata?.name ?? genUserName(event.pubkey);
  const authorPicture = author.data?.metadata?.picture;
  const authorNpub = nip19.npubEncode(event.pubkey);

  const postUrl = blogPostUrl(event.pubkey, dTag);

  const publishedDate = publishedAt
    ? new Date(Number(publishedAt) * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date(event.created_at * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <Link to={postUrl} className="group block">
      <article className="rounded-2xl border bg-card overflow-hidden hover:border-purple-400/60 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 h-full flex flex-col">
        {image ? (
          <div className="aspect-video overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-video bg-purple-900/30 flex items-center justify-center">
            <FileEdit className="w-10 h-10 text-purple-500/30" />
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {topics.slice(0, 2).map((t) => (
                <Badge
                  key={t}
                  className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
          <h3 className="font-bold text-sm leading-snug mb-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 flex-1">
            {title}
          </h3>
          {summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{summary}</p>
          )}
          {/* Author row */}
          <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
            <Link
              to={`/${authorNpub}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 min-w-0 group/author"
            >
              {authorPicture ? (
                <img
                  src={authorPicture}
                  alt={authorName}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-xs text-muted-foreground truncate group-hover/author:text-purple-600 dark:group-hover/author:text-purple-400 transition-colors">
                {authorName}
              </span>
            </Link>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Calendar className="w-3 h-3" />
              {publishedDate}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

const Index = () => {
  useSeoMeta({
    title: 'wordstr',
    description:
      'Publish and discover magazines, periodicals, ebooks, and blog posts on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    ogType: 'website',
    ogSiteName: 'wordstr',
    ogTitle: 'wordstr — Magazines, Ebooks & Blogs on Nostr',
    ogDescription:
      'Publish and discover magazines, periodicals, ebooks, and blog posts on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    ogImage: 'https://blossom.primal.net/7a4177f088e9d9a004611a2d9a68c8d926ed4374e8afd560e9fa273e859aecdb.jpg',
    ogUrl: 'https://blog.cloudflareblog.workers.dev',
    twitterCard: 'summary_large_image',
    twitterTitle: 'wordstr — Magazines, Ebooks & Blogs on Nostr',
    twitterDescription:
      'Publish and discover magazines, periodicals, ebooks, and blog posts on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    twitterImage: 'https://blossom.primal.net/7a4177f088e9d9a004611a2d9a68c8d926ed4374e8afd560e9fa273e859aecdb.jpg',
  });

  const { user } = useCurrentUser();
  const { data: magazines, isLoading: magsLoading } = useMagazines();
  const { data: ebooks, isLoading: ebooksLoading } = useEbooks(SITE_OWNER_PUBKEY);
  const { data: blogs, isLoading: blogsLoading } = useBlogs(30);
  const [tab, setTab] = useState<'magazines' | 'ebooks' | 'blogs'>('magazines');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img
              src="/wordstr-logo.jpg"
              alt="wordstr"
              className="h-9 w-auto rounded-md shadow-sm"
            />
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <Link to="/drafts">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  >
                    <FileStack className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Drafts</span>
                  </Button>
                </Link>
                <Link to="/publish">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Publish</span>
                  </Button>
                </Link>
              </>
            )}
            <ThemeToggle />
            <LoginArea className="max-w-52" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Solid black background */}
        <div className="absolute inset-0 bg-black" />
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(167,139,250,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center px-4 py-16 sm:py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-5 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            Decentralised publishing on Nostr
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            <span className="text-purple-400">
              word
            </span>
            <span className="text-white">str</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
            Publish and discover magazines, periodicals, ebooks, and blog posts on the open Nostr network.
            No paywalls. No algorithms. Your content, forever.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {user ? (
              <Link to="/publish">
                <Button
                  size="lg"
                  className="gap-2 bg-white text-purple-900 hover:bg-purple-50 font-semibold shadow-lg shadow-purple-900/30"
                >
                  <PenLine className="w-5 h-5" />
                  Start Publishing
                </Button>
              </Link>
            ) : (
              <LoginArea className="max-w-52" />
            )}
          </div>
        </div>
      </section>

      {/* Browse */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'magazines' | 'ebooks' | 'blogs')}>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <TabsList className="bg-muted/60">
              <TabsTrigger
                value="magazines"
                className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Newspaper className="w-4 h-4" />
                <span>Magazines</span>
                {magazines && (
                  <span className="text-xs opacity-70 hidden sm:inline">({magazines.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="ebooks"
                className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ebooks</span>
                {ebooks && (
                  <span className="text-xs opacity-70 hidden sm:inline">({ebooks.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="blogs"
                className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <FileEdit className="w-4 h-4" />
                <span>Blogs</span>
                {blogs && (
                  <span className="text-xs opacity-70 hidden sm:inline">({blogs.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Magazines tab */}
          <TabsContent value="magazines">
            {magsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[3/2] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : magazines && magazines.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {magazines.map((mag) => (
                  <MagazineCard key={mag.id} event={mag} />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-purple-200 dark:border-purple-900 rounded-2xl py-16 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No magazines yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Be the first to publish a magazine on Nostr.
                </p>
                {user && (
                  <Link to="/publish/magazine">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Magazine
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          {/* Ebooks tab */}
          <TabsContent value="ebooks">
            {ebooksLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[2/3] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : ebooks && ebooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {ebooks.map((eb) => (
                  <EbookCard key={eb.id} event={eb} />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-purple-200 dark:border-purple-900 rounded-2xl py-16 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No ebooks yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Share your first ebook on Nostr.
                </p>
                {user && (
                  <Link to="/publish/ebook">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Publish Ebook
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          {/* Blogs tab */}
          <TabsContent value="blogs">
            {blogsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border overflow-hidden space-y-0">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-1/3 mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : blogs && blogs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {blogs.map((post) => (
                  <BlogPreviewCard key={post.id} event={post} />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-purple-200 dark:border-purple-900 rounded-2xl py-16 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <FileEdit className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Be the first to publish a long-form blog post on Nostr.
                </p>
                {user && (
                  <Link to="/publish/blog">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Write a Blog Post
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-4 text-center text-sm text-muted-foreground">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="font-semibold text-foreground/70">wordstr</span>
          <span>— Publications on</span>
          <a href="https://nostr.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors font-medium">
            Nostr
          </a>
          <span>·</span>
          <Link to="/changelog" className="hover:text-foreground transition-colors">
            v{APP_VERSION}
          </Link>
          <span>·</span>
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Vibed with Shakespeare & Marc's 🍝 Code.
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Index;
