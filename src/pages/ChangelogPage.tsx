import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

interface Release {
  version: string;
  date: string;
  tag: 'feat' | 'fix' | 'initial';
  title: string;
  items: string[];
}

const RELEASES: Release[] = [
  {
    version: '1.1.2',
    date: '2026-05-23',
    tag: 'fix',
    title: 'Removed relay.nostr.band and purplepag.es from default relay list',
    items: [
      'Removed wss://relay.nostr.band and wss://purplepag.es from the default relay pool.',
      'Default relay pool is now 13 relays.',
    ],
  },
  {
    version: '1.1.1',
    date: '2026-05-23',
    tag: 'fix',
    title: 'Expanded default relay list for better content discovery',
    items: [
      'Default relay pool expanded from 3 to 15 relays for significantly better reach when publishing and browsing magazines and ebooks.',
      'Added nos.lol, relay.nostr.band, nostr.wine, relay.snort.social, purplepag.es for broad general-purpose coverage.',
      'Added relay.nostr.hu, nostr.mom, relay.orangepill.dev, offchain.pub as long-form / article-friendly relays.',
      'Added nostr.fmt.wiz.biz, eden.nostr.land, relay.current.fyi as well-known stable relays.',
      'All new relays are enabled for both read and write. Users with a NIP-65 relay list will still use their own relays automatically.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-01',
    tag: 'fix',
    title: 'Blossom upload reliability',
    items: [
      'Fixed "all promises rejected" AggregateError that swallowed real server error messages — uploads now report the actual HTTP status from each server.',
      'Fixed "failed to fetch" on second upload attempt caused by empty Content-Type on mobile browsers (iOS Safari, Android Chrome). File MIME type is now sniffed from the file extension as a fallback.',
      'Bumped Blossom auth event expiration from 60 s to 300 s to prevent race conditions on slow connections.',
      'Added Content-Length header to all upload requests to satisfy strict servers.',
      'Expanded Blossom server fallback list: primal.net → satellite.earth → nostrcheck.me → blossom.band.',
      'useUploadFile now delegates to useBlossomUpload for consistent behaviour across the app.',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-04-30',
    tag: 'feat',
    title: 'App icon, OG image & NIP-89 listing',
    items: [
      'AI-generated app icon (amber-orange magazine motif on dark background) added to /public/.',
      'AI-generated Open Graph social preview image (1536 × 1024) added to /public/.',
      'SVG favicon with newspaper-page motif; apple-touch-icon and theme-color meta.',
      'Full Open Graph and Twitter Card meta tags in both index.html (static) and Index.tsx (dynamic via useSeoMeta).',
      'Web app manifest updated: dark background colour, maskable icon purpose.',
      'Published PressStr as a NIP-89 kind-31990 app event on Nostr, supporting kinds 34609, 39731, 33953 with naddr web handler.',
    ],
  },
  {
    version: '1.0.1',
    date: '2026-04-28',
    tag: 'fix',
    title: 'Download button & edit/delete/comments',
    items: [
      'Fixed Download button: the HTML download attribute is silently ignored for cross-origin URLs. The button now fetches the file as a Blob, creates a temporary object URL, and triggers a real Save dialog on all browsers.',
      'Edit forms for magazines, issues, and ebooks — pre-filled with existing data, re-publish with the same d tag to replace the addressable event in-place.',
      'Delete (NIP-09 kind-5) with AlertDialog confirmation for magazines, issues, and ebooks. Owner-only ⋯ dropdown in view headers.',
      'NIP-22 (kind 1111) threaded comments on issue and ebook pages, with reply support, per-comment menu (Open in Ditto / Delete own), and login prompt for guests.',
      'NoteContent component for rendering comment text with URL linkification.',
      'Edit routes: /edit/magazine/:naddr, /edit/issue/:naddr, /edit/ebook/:naddr.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-04-28',
    tag: 'initial',
    title: 'Initial release — PressStr',
    items: [
      'NIP.md defining three new addressable Nostr event kinds: 34609 (Magazine), 39731 (Magazine Issue), 33953 (Ebook).',
      'Magazine issues carry a free-form issue label (not restricted to numbers), a cover image, and a PDF file.',
      'Ebooks support both PDF and EPUB formats.',
      'PDF first-page extraction via PDF.js loaded from CDN as a blob: URL (CSP-safe, not bundled). Automatically generates a cover image when none is uploaded manually.',
      'Blossom file uploads with SHA-256 integrity hash computed in-browser.',
      'Browseable home page with Magazines and Ebooks tabs.',
      'Magazine detail page with issue grid and "New Issue" button for owners.',
      'Issue detail page linking back to the parent magazine.',
      'Ebook detail page with Download and Open-in-browser buttons.',
      'NIP-19 naddr routing for all three kinds.',
      'Publish hub at /publish with cards for magazine, issue, and ebook creation.',
      'Fully responsive layout down to 360 px; no camera-capture on file inputs (mobile-friendly).',
      '"Vibed with Shakespeare" footer credit.',
    ],
  },
];

const tagColors: Record<Release['tag'], string> = {
  feat: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  fix: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  initial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const tagLabels: Record<Release['tag'], string> = {
  feat: 'Feature',
  fix: 'Fix',
  initial: 'Launch',
};

export function ChangelogPage() {
  useSeoMeta({
    title: `Changelog — PressStr v${APP_VERSION}`,
    description: 'Full release history for PressStr, the decentralised magazine and ebook platform on Nostr.',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Newspaper className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold tracking-tight">PressStr</span>
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-medium">Changelog</span>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground font-mono">v{APP_VERSION}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Changelog</h1>
          <p className="text-muted-foreground">
            All notable changes to PressStr, in reverse-chronological order.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" aria-hidden />

          <div className="space-y-10">
            {RELEASES.map((release) => (
              <div key={release.version} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full border-2 border-border bg-background flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>

                <div className="space-y-3">
                  {/* Version header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-lg">v{release.version}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tagColors[release.tag]}`}
                    >
                      {tagLabels[release.tag]}
                    </span>
                    <time
                      dateTime={release.date}
                      className="text-sm text-muted-foreground ml-auto"
                    >
                      {new Date(release.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>

                  <h2 className="text-base font-semibold">{release.title}</h2>

                  <ul className="space-y-1.5">
                    {release.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            PressStr is open-source and built on{' '}
            <a href="https://nostr.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Nostr</a>.{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Vibed with Shakespeare</a>.
          </p>
          <p className="mt-1">
            <Link to="/" className="hover:text-foreground transition-colors">← Back to PressStr</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
