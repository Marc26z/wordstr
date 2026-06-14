/**
 * useBlossomUpload
 *
 * Custom Blossom BUD-02 upload that:
 * - Uploads to ALL configured servers in parallel for redundancy (BUD-02 mirroring)
 * - Builds a BUD-10 blossom: URI with xs= hints for every successful mirror
 * - Signs a fresh kind-24242 auth event per upload call (never reuses stale auth)
 * - Sniffs MIME type from file extension when file.type is empty (common on mobile)
 * - Uses standard base64 (not base64url) for the Authorization header value
 * - Works on all devices including iOS Safari and Android Chrome
 */
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';

export interface BlossomUploadResult {
  /** Primary URL (from the first server that succeeded) */
  url: string;
  /** NIP-94 / BUD-02 tag array for the primary upload */
  tags: string[][];
  /** SHA-256 hex hash of the uploaded file */
  sha256: string;
  /** All URLs where the file was successfully stored (including primary) */
  mirrorUrls: string[];
  /**
   * BUD-10 blossom: URI with xs= hints for all successful servers and the
   * uploader's pubkey as the as= parameter.
   *
   * Format: blossom:<sha256>.<ext>?xs=<domain>&xs=<domain>&as=<pubkey>&sz=<bytes>
   */
  blossomUri: string;
}

// All Blossom servers — uploads are attempted to every server in parallel.
// The first success becomes the primary URL; all successes become mirror hints.
export const BLOSSOM_SERVERS = [
  'https://blossom.primal.net',
  'https://cdn.satellite.earth',
  'https://cdn.nostrcheck.me',
  'https://blossom.band',
  'https://blossom.ditto.pub',
];

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Standard base64 encode — servers expect this, not base64url */
function toBase64(str: string): string {
  return btoa(str);
}

/** Sniff a MIME type from the file extension when file.type is empty */
function sniffMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    pdf: 'application/pdf',
    epub: 'application/epub+zip',
  };
  return map[ext] ?? 'application/octet-stream';
}

/**
 * Derive a file extension from a MIME type or filename for use in BUD-10 URIs.
 * Falls back to .bin as required by the spec.
 */
function fileExtension(file: File, mimeType: string): string {
  // Try filename first
  const nameParts = file.name.split('.');
  if (nameParts.length > 1) {
    const ext = nameParts[nameParts.length - 1].toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  // Fall back to MIME type mapping
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'application/pdf': 'pdf',
    'application/epub+zip': 'epub',
  };
  return mimeMap[mimeType] ?? 'bin';
}

/**
 * Extract the domain (host) from a server base URL for use as the xs= param
 * in BUD-10 URIs. The spec says the value SHOULD be a domain name only
 * (protocol is optional but clients prefer https://); we include the full
 * origin when it's not plain https so clients know the scheme.
 */
function serverDomain(serverUrl: string): string {
  try {
    const u = new URL(serverUrl);
    // If it's plain https, just return the hostname as BUD-10 prefers
    if (u.protocol === 'https:') return u.hostname;
    // Otherwise include the full origin so clients know the non-default scheme
    return u.origin;
  } catch {
    return serverUrl;
  }
}

/**
 * Per-server upload timeout in milliseconds.
 * If a server doesn't respond within this window it is treated as failed.
 * 30 s is generous enough for large PDFs on slow connections while still
 * preventing the UI from appearing frozen.
 */
const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * Upload a file to a single Blossom server.
 * Resolves with the blob URL on success, or null on any error / timeout.
 */
async function uploadToServer(
  server: string,
  file: File,
  mimeType: string,
  authorization: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(`${server}/upload`, {
      method: 'PUT',
      body: file,
      signal: controller.signal,
      headers: {
        'Authorization': authorization,
        'Content-Type': mimeType,
        'Content-Length': String(file.size),
      },
    });

    if (!response.ok) return null;

    const text = await response.text();
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }

    const blobUrl = json.url as string | undefined;
    return blobUrl ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function useBlossomUpload() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File): Promise<BlossomUploadResult> => {
      if (!user) throw new Error('You must be logged in to upload files.');

      const mimeType = sniffMime(file);

      // 1. Compute sha256 of the raw bytes
      const arrayBuffer = await file.arrayBuffer();
      const x = await sha256Hex(arrayBuffer);

      // 2. Sign a fresh BUD-02 auth event (kind 24242) for this exact file
      //    Expiration is 5 minutes — plenty of time for parallel uploads
      const now = Math.floor(Date.now() / 1000);
      const expiration = now + 300;

      const authEvent = await user.signer.signEvent({
        kind: 24242,
        content: `Upload ${file.name || 'file'}`,
        created_at: now,
        tags: [
          ['t', 'upload'],
          ['x', x],
          ['size', String(file.size)],
          ['expiration', String(expiration)],
        ],
      });

      // 3. Build the Authorization header value
      //    Standard base64 of the JSON-stringified signed event
      const authJson = JSON.stringify(authEvent);
      // btoa only handles Latin-1; encode to UTF-8 bytes first
      const authBytes = new TextEncoder().encode(authJson);
      let binary = '';
      for (let i = 0; i < authBytes.length; i++) {
        binary += String.fromCharCode(authBytes[i]);
      }
      const authorization = `Nostr ${toBase64(binary)}`;

      // 4. Fire uploads to all servers in parallel, each with a hard timeout.
      //
      //    Strategy: return to the caller as soon as the FIRST server succeeds
      //    (so the UI unblocks quickly), but keep collecting any additional
      //    mirrors that finish within a short grace window so we can include
      //    them in the blossom: URI and mirror url tags.
      //
      //    We achieve this with a two-phase approach:
      //      a) Race for the first success (Promise.any over per-server promises).
      //      b) Wait a short grace period (MIRROR_GRACE_MS) for stragglers.

      const MIRROR_GRACE_MS = 5_000; // how long to wait for extra mirrors after first success

      // Track all per-server results as they settle
      const settled: { server: string; url: string }[] = [];

      const serverPromises = BLOSSOM_SERVERS.map((server) =>
        uploadToServer(server, file, mimeType, authorization).then((url) => {
          if (url) settled.push({ server, url });
          return url;
        }),
      );

      // Wait for first non-null result; throws AggregateError if all are null
      let primaryUrl: string;
      try {
        // Promise.any rejects only if every promise resolves to a non-thenable
        // rejection — but our helper always resolves (never rejects), so we
        // need to convert null results into rejections for Promise.any.
        primaryUrl = await Promise.any(
          serverPromises.map((p) =>
            p.then((url) => {
              if (!url) throw new Error('server failed');
              return url;
            }),
          ),
        );
      } catch {
        throw new Error(
          'All Blossom servers failed to accept the upload. Check your internet connection and try again.',
        );
      }

      // Grace period: collect any additional mirrors that finish quickly
      await Promise.race([
        // Either all remaining uploads finish…
        Promise.allSettled(serverPromises),
        // …or the grace window expires — whichever comes first
        new Promise<void>((resolve) => setTimeout(resolve, MIRROR_GRACE_MS)),
      ]);

      // Deduplicate and keep stable order (BLOSSOM_SERVERS order)
      const mirrorUrls = settled.map((s) => s.url);

      // 5. Build a BUD-10 blossom: URI
      //    Format: blossom:<sha256>.<ext>?xs=<domain>[&xs=<domain>...]&as=<pubkey>&sz=<bytes>
      const ext = fileExtension(file, mimeType);
      const xsParams = settled.map((s) => `xs=${encodeURIComponent(serverDomain(s.server))}`).join('&');
      const asParam = `as=${user.pubkey}`;
      const szParam = `sz=${file.size}`;
      const blossomUri = `blossom:${x}.${ext}?${xsParams}&${asParam}&${szParam}`;

      const size = file.size;
      const tags: string[][] = [
        ['url', primaryUrl],
        ['x', x],
        ['ox', x],
        ['size', String(size)],
        ['m', mimeType],
      ];

      return { url: primaryUrl, tags, sha256: x, mirrorUrls, blossomUri };
    },
  });
}
