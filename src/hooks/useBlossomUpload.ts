/**
 * useBlossomUpload
 *
 * Custom Blossom upload implementation that:
 * - Tries multiple servers sequentially, not with Promise.any(), so we always
 *   get a meaningful error message instead of AggregateError("All promises rejected")
 * - Signs the BUD-02 auth event (kind 24242) ourselves for full control
 * - Returns the public URL, NIP-94 tags, and sha256
 * - Works on all devices including iOS Safari / Android Chrome
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

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function useBlossomUpload() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File): Promise<BlossomUploadResult> => {
      if (!user) throw new Error('You must be logged in to upload files.');

      // 1. Compute sha256 of the file
      const arrayBuffer = await file.arrayBuffer();
      const x = await sha256Hex(arrayBuffer);
      const now = Math.floor(Date.now() / 1000);

      // 2. Sign a BUD-02 auth event (kind 24242)
      const authEvent = await user.signer.signEvent({
        kind: 24242,
        content: `Upload ${file.name || 'file'}`,
        created_at: now,
        tags: [
          ['t', 'upload'],
          ['x', x],
          ['size', String(file.size)],
          ['expiration', String(now + 60)],
        ],
      });

      // 3. Encode auth event as base64url for the Authorization header
      const authJson = JSON.stringify(authEvent);
      const authBytes = new TextEncoder().encode(authJson);
      const authorization = `Nostr ${base64url(authBytes)}`;

      // 4. Try each server in sequence; return on first success
      const errors: string[] = [];

      for (const server of BLOSSOM_SERVERS) {
        try {
          const uploadUrl = `${server}/upload`;
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Authorization': authorization,
              'Content-Type': file.type || 'application/octet-stream',
            },
          });

          const text = await response.text();

          if (!response.ok) {
            errors.push(`${server}: ${response.status} ${text.slice(0, 120)}`);
            continue;
          }

          let json: Record<string, unknown>;
          try {
            json = JSON.parse(text) as Record<string, unknown>;
          } catch {
            errors.push(`${server}: non-JSON response`);
            continue;
          }

          const blobUrl = json.url as string | undefined;
          const sha256 = (json.sha256 as string | undefined) ?? x;
          const size = (json.size as number | undefined) ?? file.size;
          const type = (json.type as string | undefined) ?? file.type;

          if (!blobUrl) {
            errors.push(`${server}: no URL in response`);
            continue;
          }

          const tags: string[][] = [
            ['url', blobUrl],
            ['x', sha256],
            ['ox', sha256],
            ['size', String(size)],
          ];
          if (type) tags.push(['m', type]);

          return { url: blobUrl, tags, sha256 };
        } catch (err) {
          errors.push(`${server}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // All servers failed — report the first concrete error
      throw new Error(errors[0] ?? 'All Blossom servers failed. Check your connection.');
    },
  });
}
