import { useNostrPublish } from './useNostrPublish';
import { KIND_MAGAZINE, KIND_MAGAZINE_ISSUE, KIND_EBOOK } from '@/lib/pressstr';
import type { MagazineData, MagazineIssueData, EbookData } from '@/lib/pressstr';

export function usePublishMagazine() {
  const { mutateAsync } = useNostrPublish();

  return {
    publishMagazine: async (data: MagazineData) => {
      const tags: string[][] = [
        ['d', data.d],
        ['title', data.title],
        ['alt', `Magazine: ${data.title}`],
      ];
      if (data.image) tags.push(['image', data.image]);
      if (data.summary) tags.push(['summary', data.summary]);
      if (data.language) tags.push(['l', data.language]);
      if (data.url) tags.push(['url', data.url]);
      for (const t of data.topics) {
        if (t.trim()) tags.push(['t', t.trim().toLowerCase()]);
      }
      return mutateAsync({
        kind: KIND_MAGAZINE,
        content: data.content,
        tags,
      });
    },

    publishMagazineIssue: async (data: MagazineIssueData) => {
      const tags: string[][] = [
        ['d', data.d],
        ['title', data.title],
        ['issue', data.issue],
        ['a', data.magazineCoord],
        ['image', data.image],
        // Primary URL always first
        ['url', data.fileUrl],
        ['m', data.mimeType],
        ['alt', `Magazine Issue: ${data.title}, Issue ${data.issue}`],
      ];
      if (data.fileSize) tags.push(['size', String(data.fileSize)]);
      if (data.fileHash) tags.push(['x', data.fileHash]);
      // Additional mirror URLs (skip the primary to avoid duplicates)
      if (data.mirrorUrls) {
        for (const mirrorUrl of data.mirrorUrls) {
          if (mirrorUrl && mirrorUrl !== data.fileUrl) {
            tags.push(['url', mirrorUrl]);
          }
        }
      }
      // BUD-10 blossom: URI
      if (data.blossomUri) tags.push(['blossom', data.blossomUri]);
      if (data.summary) tags.push(['summary', data.summary]);
      if (data.publishedAt) tags.push(['published_at', String(data.publishedAt)]);
      for (const t of data.topics) {
        if (t.trim()) tags.push(['t', t.trim().toLowerCase()]);
      }
      return mutateAsync({
        kind: KIND_MAGAZINE_ISSUE,
        content: data.content,
        tags,
      });
    },

    publishEbook: async (data: EbookData) => {
      const tags: string[][] = [
        ['d', data.d],
        ['title', data.title],
        ['image', data.image],
        // Primary URL always first
        ['url', data.fileUrl],
        ['m', data.mimeType],
        ['alt', `Ebook: ${data.title}`],
      ];
      for (const a of data.authors) {
        if (a.trim()) tags.push(['author', a.trim()]);
      }
      if (data.summary) tags.push(['summary', data.summary]);
      if (data.publishedAt) tags.push(['published_at', String(data.publishedAt)]);
      if (data.fileSize) tags.push(['size', String(data.fileSize)]);
      if (data.fileHash) tags.push(['x', data.fileHash]);
      // Additional mirror URLs (skip the primary to avoid duplicates)
      if (data.mirrorUrls) {
        for (const mirrorUrl of data.mirrorUrls) {
          if (mirrorUrl && mirrorUrl !== data.fileUrl) {
            tags.push(['url', mirrorUrl]);
          }
        }
      }
      // BUD-10 blossom: URI
      if (data.blossomUri) tags.push(['blossom', data.blossomUri]);
      if (data.language) tags.push(['l', data.language]);
      if (data.isbn) tags.push(['isbn', data.isbn]);
      for (const t of data.topics) {
        if (t.trim()) tags.push(['t', t.trim().toLowerCase()]);
      }
      return mutateAsync({
        kind: KIND_EBOOK,
        content: data.content,
        tags,
      });
    },
  };
}
