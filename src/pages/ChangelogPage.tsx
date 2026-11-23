import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
    version: '1.16.0',
    date: '2026-11-22',
    tag: 'feat',
    title: 'Sell magazines and blog posts for Bitcoin',
    items: [
      'Added a price field to magazine, magazine issue, and blog post forms; setting a price publishes a NIP-99 listing, and clearing it deactivates the listing.',
      'Reused the guest Lightning checkout for all paid content: visitors pay without logging in and paid files download automatically.',
      'Paid blog posts and magazines now unlock their content / issue list after a verified NIP-57 receipt.',
    ],
  },
  {
    version: '1.15.0',
    date: '2026-11-22',
    tag: 'feat',
    title: 'One-click NIP-07 extension sign-in',
    items: [
      'Added a prominent “Sign in with browser extension” button on the first screen of the login dialog.',
      'Improved NIP-07 detection, re-checking after load and window focus, with clear guidance and installation links when no extension is found.',
    ],
  },
  {
    version: '1.14.0',
    date: '2026-11-22',
    tag: 'feat',
    title: 'Sell ebooks for Bitcoin over Nostr',
    items: [
      'Added a price field to ebook publishing and editing. Paid ebooks get a NIP-99 kind 30402 classified listing linked to the ebook.',
      'Visitors can buy with Lightning without logging in: a temporary Nostr key signs the NIP-57 zap request, and the EPUB downloads automatically when the seller’s receipt arrives on the relay.',
      'Paid checkout shows a QR invoice and a wallet link for phones; setting the price back to 0 turns the ebook into a free download again.',
    ],
  },
  {
    version: '1.13.0',
    date: '2026-11-22',
    tag: 'feat',
    title: 'Dark mode everywhere',
    items: [
      'The entire website now always uses the dark theme on every route, with no light pages.',
      'Legacy light/system preferences are ignored, theme toggle buttons are removed, and dark mode is applied before the first render to prevent a white flash.',
    ],
  },
  {
    version: '1.12.1',
    date: '2026-11-22',
    tag: 'fix',
    title: 'Homepage waits for all blog relays',
    items: [
      'Fixed blog posts intermittently missing from the homepage when a fast relay responded before the owner\'s write relay.',
      'Increased the relay response window from 200ms to 5 seconds, allowing slower relays to return their posts before the feed is finalized.',
      'Updated zap requests to the current nostr-tools event API and made publication file pickers honor their configured file types.',
    ],
  },
  {
    version: '1.12.0',
    date: '2026-08-23',
    tag: 'feat',
    title: '"Listen in Boris" — one-tap TTS for every blog post',
    items: [
      'New Boris button (headphones icon) in the header of every blog post: opens the article in the Boris reader (read.withboris.com/a/<naddr>), which renders kind 30023 posts and reads them aloud with browser-native text-to-speech.',
      'The naddr in the link carries relay hints (damus, nos.lol, primal) which Boris follows, so articles resolve even on relays outside Boris\'s default set.',
      'No protocol changes needed: wordstr posts are standard NIP-23 kind 30023 events (d / title / summary / image / published_at / t tags, Markdown content), which is exactly what Boris renders and reads.',
      'Tip: bookmarking an article\'s naddr (NIP-51 kind 10003) adds it to your Boris reading list, and Boris shows all your kind 30023 posts under /p/<npub>/writings.',
    ],
  },
  {
    version: '1.11.3',
    date: '2026-08-23',
    tag: 'fix',
    title: 'Blog posts now load completely and consistently',
    items: [
      'Fixed posts intermittently missing from the homepage: the app previously asked only its default relay set, and logging in swapped that set for the user\'s NIP-65 list — so results depended on which relays happened to hold (or answer for) the posts.',
      'The owner feeds now use the outbox model: the site owner\'s NIP-65 (kind 10002) write relays are discovered (via the app relays plus purplepag.es and relay.nostr.band) and queried together with the app defaults, so every post that lives on the owner\'s own relays is always found.',
      'New useOwnerWriteRelays hook (src/hooks/useOwnerWriteRelays.ts) shared by the Magazines, Ebooks, and Blogs feeds.',
      'Homepage blog limit raised from 30 to 100 so the cap itself can never hide posts.',
    ],
  },
  {
    version: '1.11.2',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Blogs tab is now the homepage default',
    items: [
      'Blog posts are now the first thing visitors see: the Blogs tab is pre-selected on the homepage and the tab order is Blogs → Magazines → Ebooks.',
    ],
  },
  {
    version: '1.11.1',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Personal homepage copy',
    items: [
      'Hero, SEO, and social meta copy updated to match the curated site: "Essays, magazines, and ebooks by Marc — writer, freedom tech educator, and AI tinkerer — published on the open Nostr network. No paywalls. No algorithms. Just words, forever."',
      'Open Graph and Twitter titles now read "wordstr — Marc’s writing on Nostr".',
    ],
  },
  {
    version: '1.11.0',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Homepage shows only the site owner\'s content',
    items: [
      'The Magazines, Ebooks, and Blogs feeds on the homepage now only show content published by the site owner: npub1marc26z8nh3xkj5rcx7ufkatvx6ueqhp5vfw9v5teq26z254renshtf3g0.',
      'New SITE_OWNER_PUBKEY constant in src/lib/siteOwner.ts; the feed hooks filter with an authors clause at the relay level.',
      'Direct links to other authors\' content (naddr, /blog/:npub/:slug, and npub profile routes) still resolve normally — only the homepage feeds are curated.',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Zap the author — Lightning tips on blog posts',
    items: [
      'New "Zap the author" card at the end of every blog post, shown to logged-in readers when the author has a Lightning address (lud16/lud06).',
      'Full NIP-57 zap flow: preset amounts (1–1000 sats), custom amounts, and an optional comment, resolved via the author\'s Lightning address.',
      'Three payment methods tried in order: Nostr Wallet Connect (NIP-47 via @getalby/sdk), WebLN browser wallets (Alby and friends), or a QR code / lightning: URI fallback that works with any wallet.',
      'Zap requests reference both the event id and the addressable a-tag of the kind 30023 post, so zap receipts attach to the post in zap-aware clients.',
      'New infrastructure: NWCContext provider, useNWC / useWallet / useZaps hooks, and ZapDialog / ZapButton / WalletModal components.',
    ],
  },
  {
    version: '1.9.2',
    date: '2026-08-23',
    tag: 'fix',
    title: 'Hero h1 lowercased to "wordstr"',
    items: [
      'The homepage hero heading now reads "wordstr" in lowercase. It is split across two styled spans ("word" in purple, "str" in white), so it was missed by the v1.9.1 find-and-replace.',
    ],
  },
  {
    version: '1.9.1',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Brand name lowercased to "wordstr"',
    items: [
      'All instances of "WordStr" are now lowercase "wordstr": page titles, Open Graph and Twitter meta tags, web app manifest, logo alt text, footer, and page copy.',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Flat solid purple & black theme — gradients removed',
    items: [
      'Hero and profile banner backgrounds are now solid black instead of a black-to-purple gradient.',
      'All purple/violet gradient fills replaced with solid purple across icon badges, avatar fallbacks, and placeholder tiles.',
      'Hero headline "Word" is now solid purple instead of a gradient text wash.',
      'Magazine, issue, and ebook fallback tiles now use solid amber, blue, and purple tints respectively.',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-08-23',
    tag: 'feat',
    title: 'New hand-painted wordstr logo',
    items: [
      'The site header now shows the new hand-painted "wordstr" logo artwork, replacing the purple gradient icon and gradient wordmark.',
      'Logo updated on the homepage navbar and the Drafts and Changelog page headers; the artwork is served from /wordstr-logo.jpg.',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Promotional videos for blog posts',
    items: [
      'Blog posts can now include a promotional video via a new "Promo Video" field on the publish and edit forms.',
      'Paste a Divine video page link (https://divine.video/video/…) or a direct video URL; the URL is stored in a `video` tag on the kind 30023 event.',
      'Divine links are resolved from the kind 34236 event on the Divine relay and played inline with a native HTML5 video player.',
      'The promo video appears at the top of the blog post page and on the author profile blog cards.',
      'Local drafts now also save the promo video URL.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Dark mode by default with a light theme toggle',
    items: [
      'The app now defaults to dark mode.',
      'New ThemeToggle component switches between dark and light themes and is available from every major page header.',
      'Blog post Markdown rendering is now theme-aware: dark mode keeps the rich violet-on-black reader experience, light mode uses readable muted text on the card background.',
      'Theme preference is persisted in the existing app config (localStorage).',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-08-23',
    tag: 'feat',
    title: 'Blog drafts and improved post editing',
    items: [
      'New localStorage-based draft system for NIP-23 blog posts. Drafts are auto-saved as you write and scoped to your Nostr pubkey.',
      'New /drafts page lists all saved drafts with continue, publish, and delete actions.',
      'New BlogPostEditor shared component powers both the publish and edit forms with consistent Markdown preview, hero image, and draft saving.',
      'New blog posts can be started from a draft via /publish/blog?draft=<id>. Published posts automatically delete their source draft.',
      'Editing a published blog post now auto-saves a draft keyed to the post d-tag; the draft is cleaned up when the update is published.',
      'Edit links are now visible on the author blog list page for each owned post, in addition to the existing post detail menu.',
      'Drafts and Publish hub both link to the new drafts page for quick access.',
    ],
  },
  {
    version: '1.4.2',
    date: '2026-07-13',
    tag: 'feat',
    title: 'Human-readable blog post URLs using article slug',
    items: [
      'Blog posts are now served at /blog/:npub/:slug (e.g. /blog/npub1marc…/my-post-title) instead of the opaque naddr1… identifier.',
      'New BlogPostPage component handles the /blog/:npub/:slug route — decodes the npub to a hex pubkey and queries Nostr for the matching kind 30023 event by author + d-tag.',
      'After publishing or editing a blog post, the app navigates to the slug URL automatically.',
      'All blog card links on the homepage and author blog list now use the slug URL.',
      'naddr1 links still resolve through the NIP-19 catch-all route for compatibility with other Nostr clients.',
      'New blogPostUrl(pubkey, slug) helper in src/lib/blogUrl.ts centralises URL construction.',
    ],
  },
  {
    version: '1.4.1',
    date: '2026-07-13',
    tag: 'fix',
    title: 'Blog post text is now always white; hero image uploads to Blossom',
    items: [
      'Fixed blog post body text: all paragraph, heading, list, blockquote, table, and code text is now explicitly white/violet on the dark background using inline styles — no longer dependent on Tailwind prose class generation.',
      'Each Markdown element (h1–h4, p, a, strong, em, code, pre, blockquote, ul, ol, li, hr, img, table, th, td) is rendered with a custom component carrying guaranteed inline colour styles.',
      'Replaced the small 2:3 CoverImagePicker with a new full-width HeroImageUploader on blog publish and edit forms.',
      'HeroImageUploader is 16:9, full-width, drag-and-drop, with upload progress spinner, hover-to-replace overlay, and "Stored on Blossom" confirmation — uploads directly to all 5 Blossom mirror servers in parallel.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-07-13',
    tag: 'feat',
    title: 'NIP-23 blog posts — write, publish & browse long-form articles',
    items: [
      'New Blog Post type: publish long-form Markdown articles as NIP-23 kind 30023 addressable events.',
      'Markdown editor with live Write / Preview tabs on the publish and edit forms — supports GFM (tables, strikethrough, task lists).',
      'Blogs tab on the homepage showing the 30 most recent posts from the network in a responsive card grid with cover image, tags, author avatar and date.',
      'Blog post view: dark-mode rich Markdown renderer (black background, violet headings, purple code highlights, blockquote glow) with author card and NIP-22 comments.',
      'Author blog list: visiting any npub now shows that person\'s profile banner, avatar, bio, and all their blog posts sorted newest-first.',
      '"View all posts" button on blog post view links back to the author\'s blog list page.',
      'Edit blog post form at /edit/blog/:naddr — pre-fills all fields from the existing event.',
      'Publish hub updated: Blog Post card appears at the top as the primary new content type.',
      'Added react-markdown and remark-gfm for CSP-safe Markdown rendering (no dangerouslySetInnerHTML).',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-07-13',
    tag: 'feat',
    title: 'Rebranded to wordstr with black, purple & white theme',
    items: [
      'Application renamed from PressStr to wordstr across all pages, meta tags, manifests, and documentation.',
      'New black × purple × white colour scheme: rich violet primary (#7c3aed), near-black backgrounds in dark mode, crisp white in light mode.',
      'Hero section redesigned with a dark gradient (black → purple), dot-grid overlay, animated glow blobs, and gradient headline.',
      'Navbar logo updated: purple gradient icon with gradient "wordstr" wordmark.',
      'Tab active state now uses purple-600 pill.',
      'Empty-state cards use purple-tinted dashed borders and purple icon backgrounds.',
      'Publish hub cards restyled with purple/violet/fuchsia icon badges.',
      'Changelog timeline dot updated to purple.',
      'Footer Nostr link highlighted in purple.',
      'theme-color meta tag updated to #7c3aed.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-06-10',
    tag: 'feat',
    title: 'Multi-server Blossom uploads and BUD-10 blossom: URI support',
    items: [
      'Files (PDFs, EPUBs, cover images) are now uploaded to all 5 Blossom servers simultaneously instead of stopping at the first success — every upload is automatically mirrored for resilience.',
      'Added blossom.ditto.pub to the Blossom server pool alongside primal.net, satellite.earth, nostrcheck.me, and blossom.band.',
      'Published events now include one url tag per successful mirror, so readers can fall back to an alternate server if one goes offline.',
      'Published events now include a blossom tag with a BUD-10 blossom: URI encoding the SHA-256 hash, file extension, all mirror server domains (xs= params), the uploader\'s pubkey (as= param), and the file size (sz= param).',
      'Edit (re-publish) flows preserve existing mirror url tags and blossom: URI from the original event when the file is not replaced.',
      'NIP.md updated to document multi-server mirroring and the BUD-10 blossom: URI tag schema.',
    ],
  },
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
    title: `Changelog — wordstr v${APP_VERSION}`,
    description: 'Full release history for wordstr, the decentralised magazine and ebook platform on Nostr.',
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
            <img
              src="/wordstr-logo.jpg"
              alt="wordstr"
              className="h-6 w-auto rounded"
            />
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
            All notable changes to wordstr, in reverse-chronological order.
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
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
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
            wordstr is open-source and built on{' '}
            <a href="https://nostr.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">Nostr</a>.{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Vibed with Shakespeare</a>.
          </p>
          <p className="mt-1">
            <Link to="/" className="hover:text-foreground transition-colors">← Back to wordstr</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
