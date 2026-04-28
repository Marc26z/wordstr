/**
 * useBlossomUpload
 *
 * A robust Blossom upload hook that:
 * - Works on all devices including iOS Safari / Android Chrome
 * - Accepts File objects (from <input type="file"> or programmatically constructed)
 * - Returns the public URL and NIP-94 tags
 * - Handles auth event signing inline
 */
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

export interface BlossomUploadResult {
  url: string;
  tags: string[][];
  sha256: string;
}

export function useBlossomUpload() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File): Promise<BlossomUploadResult> => {
      if (!user) throw new Error('Must be logged in to upload files');

      const uploader = new BlossomUploader({
        servers: [
          'https://blossom.primal.net/',
          'https://blossom.band/',
        ],
        signer: user.signer,
      });

      const tags = await uploader.upload(file);

      // tags[0] is ["url", "<url>"]
      const url = tags.find(([name]) => name === 'url')?.[1];
      if (!url) throw new Error('Blossom upload did not return a URL');

      const sha256 = tags.find(([name]) => name === 'x')?.[1] ?? '';

      return { url, tags, sha256 };
    },
  });
}
