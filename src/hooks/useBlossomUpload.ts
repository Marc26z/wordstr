/**
 * useBlossomUpload
 *
 * Custom Blossom BUD-02 upload that:
 * - Tries servers sequentially (not Promise.any) so we always get a real error message
 * - Signs a fresh kind-24242 auth event per upload call (never reuses stale auth)
 * - Sniffs MIME type from file extension when file.type is empty (common on mobile)
 * - Uses standard base64 (not base64url) for the Authorization header value
 * - Works on all devices including iOS Safari and Android Chrome
 */
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';

export interface BlossomUploadResult {
  url: string;
  tags: string[][];
  sha256: string;
}

// Reliable public Blossom servers, tried in order
const BLOSSOM_SERVERS = [
  'https://blossom.primal.net',
  'https://cdn.satellite.earth',
  'https://cdn.nostrcheck.me',
  'https://blossom.band',
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
      //    Expiration is 5 minutes — plenty of time for the upload, not stale from a prior call
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

      // 4. Try each server in sequence; stop at the first success
      const errors: string[] = [];

      for (const server of BLOSSOM_SERVERS) {
        try {
          const response = await fetch(`${server}/upload`, {
            method: 'PUT',
            body: file,
            headers: {
              'Authorization': authorization,
              // Always provide Content-Type; some servers require it and mobile
              // browsers sometimes leave file.type empty for non-standard types
              'Content-Type': mimeType,
              // Content-Length avoids "411 Length Required" on strict servers
              'Content-Length': String(file.size),
            },
          });

          const text = await response.text();

          if (!response.ok) {
            errors.push(`${server}: HTTP ${response.status} — ${text.slice(0, 160)}`);
            continue;
          }

          let json: Record<string, unknown>;
          try {
            json = JSON.parse(text) as Record<string, unknown>;
          } catch {
            errors.push(`${server}: server returned non-JSON: ${text.slice(0, 80)}`);
            continue;
          }

          const blobUrl = json.url as string | undefined;
          if (!blobUrl) {
            errors.push(`${server}: response has no "url" field`);
            continue;
          }

          const sha256 = (json.sha256 as string | undefined) ?? x;
          const size = (json.size as number | undefined) ?? file.size;
          const type = (json.type as string | undefined) ?? mimeType;

          const tags: string[][] = [
            ['url', blobUrl],
            ['x', sha256],
            ['ox', sha256],
            ['size', String(size)],
            ['m', type],
          ];

          return { url: blobUrl, tags, sha256 };
        } catch (err) {
          // fetch() itself threw — typically a CORS or network error
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${server}: ${msg}`);
        }
      }

      // All servers failed — surface the first concrete error
      throw new Error(
        errors[0] ?? 'All Blossom servers failed. Check your internet connection.',
      );
    },
  });
}
