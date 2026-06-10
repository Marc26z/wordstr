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
 * Upload a file to a single Blossom server.
 * Returns the URL on success, or null on any error.
 */
async function uploadToServer(
  server: string,
  file: File,
  mimeType: string,
  authorization: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${server}/upload`, {
      method: 'PUT',
      body: file,
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

      // 4. Upload to ALL servers in parallel — collect every success
      const results = await Promise.all(
        BLOSSOM_SERVERS.map((server) =>
          uploadToServer(server, file, mimeType, authorization).then(
            (url) => ({ server, url }),
          ),
        ),
      );

      const successes = results.filter((r): r is { server: string; url: string } => r.url !== null);

      if (successes.length === 0) {
        throw new Error(
          'All Blossom servers failed to accept the upload. Check your internet connection and try again.',
        );
      }

      // 5. Primary URL is the first successful upload
      const primaryUrl = successes[0].url;
      const mirrorUrls = successes.map((s) => s.url);

      // 6. Build a BUD-10 blossom: URI
      //    Format: blossom:<sha256>.<ext>?xs=<domain>[&xs=<domain>...]&as=<pubkey>&sz=<bytes>
      const ext = fileExtension(file, mimeType);
      const xsParams = successes.map((s) => `xs=${encodeURIComponent(serverDomain(s.server))}`).join('&');
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
