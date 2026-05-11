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
import { BookOpen, Newspaper, Plus, PenLine } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const Index = () => {
  useSeoMeta({
    title: 'PressStr — Magazines & Ebooks on Nostr',
    description:
      'Publish and discover magazines, periodicals, and ebooks on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    ogType: 'website',
    ogSiteName: 'PressStr',
    ogTitle: 'PressStr — Magazines & Ebooks on Nostr',
    ogDescription:
      'Publish and discover magazines, periodicals, and ebooks on the open Nostr network. No paywalls. No algorithms. Your content, forever.',
    ogImage: 'https://blossom.primal.net/7a4177f088e9d9a004611a2d9a68c8d926ed4374e8afd560e9fa273e859aecdb.jpg',
    ogUrl: 'https://pressstr.shakespeare.wtf',
    twitterCard: 'summary_large_image',
    twitterTitle: 'PressStr — Magazines & Ebooks on Nostr',
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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PressStr</span>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <Link to="/publish">
                <Button size="sm" variant="outline">
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
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-900/20 border-b py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-amber-600 dark:text-amber-400">Press</span>Str
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Publish and discover magazines, periodicals, and ebooks on the open Nostr network.
            No paywalls. No algorithms. Your content, forever.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {user ? (
              <Link to="/publish">
                <Button size="lg" className="gap-2">
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
            <TabsList>
              <TabsTrigger value="magazines" className="gap-2">
                <Newspaper className="w-4 h-4" />
                Magazines
                {magazines && <span className="text-xs text-muted-foreground">({magazines.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="ebooks" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Ebooks
                {ebooks && <span className="text-xs text-muted-foreground">({ebooks.length})</span>}
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
              <div className="border-2 border-dashed rounded-2xl py-16 px-8 text-center">
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No magazines yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Be the first to publish a magazine on Nostr.
                </p>
                {user && (
                  <Link to="/publish/magazine">
                    <Button>
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
              <div className="border-2 border-dashed rounded-2xl py-16 px-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ebooks yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Share your first ebook on Nostr.
                </p>
                {user && (
                  <Link to="/publish/ebook">
                    <Button>
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
      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <p>
          PressStr — Publications on{' '}
          <a href="https://nostr.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Nostr
          </a>
          {' · '}
          <Link to="/changelog" className="hover:text-foreground transition-colors">
            v{APP_VERSION}
          </Link>
          {' · '}
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Vibed with Shakespeare
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Index;
