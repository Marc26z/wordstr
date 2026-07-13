import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginArea } from '@/components/auth/LoginArea';
import { MagazineCard, EbookCard } from '@/components/PublicationCard';
import { useMagazines, useEbooks } from '@/hooks/useMagazines';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { BookOpen, Newspaper, Plus, PenLine, Sparkles } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const Index = () => {
  useSeoMeta({
    title: 'WordStr',
    description:
      'Publish and discover magazines, periodicals, and ebooks on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    ogType: 'website',
    ogSiteName: 'WordStr',
    ogTitle: 'WordStr — Magazines & Ebooks on Nostr',
    ogDescription:
      'Publish and discover magazines, periodicals, and ebooks on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    ogImage: 'https://blossom.primal.net/7a4177f088e9d9a004611a2d9a68c8d926ed4374e8afd560e9fa273e859aecdb.jpg',
    ogUrl: 'https://blog.cloudflareblog.workers.dev',
    twitterCard: 'summary_large_image',
    twitterTitle: 'WordStr — Magazines & Ebooks on Nostr',
    twitterDescription:
      'Publish and discover magazines, periodicals, and ebooks on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    twitterImage: 'https://blossom.primal.net/7a4177f088e9d9a004611a2d9a68c8d926ed4374e8afd560e9fa273e859aecdb.jpg',
  });

  const { user } = useCurrentUser();
  const { data: magazines, isLoading: magsLoading } = useMagazines();
  const { data: ebooks, isLoading: ebooksLoading } = useEbooks();
  const [tab, setTab] = useState<'magazines' | 'ebooks'>('magazines');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
              WordStr
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
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
            )}
            <LoginArea className="max-w-52" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950 to-violet-900" />
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
            <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-white bg-clip-text text-transparent">
              Word
            </span>
            <span className="text-white">Str</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
            Publish and discover magazines, periodicals, and ebooks on the open Nostr network.
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
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'magazines' | 'ebooks')}>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <TabsList className="bg-muted/60">
              <TabsTrigger
                value="magazines"
                className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Newspaper className="w-4 h-4" />
                <span>Magazines</span>
                {magazines && (
                  <span className="text-xs opacity-70 hidden sm:inline">({magazines.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="ebooks"
                className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ebooks</span>
                {ebooks && (
                  <span className="text-xs opacity-70 hidden sm:inline">({ebooks.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

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
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-4 text-center text-sm text-muted-foreground">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="font-semibold text-foreground/70">WordStr</span>
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
