import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface BlogDraft {
  /** Local-only draft identifier. */
  id: string;
  /**
   * Optional d-tag of the published post this draft is editing.
   * Set when a draft is created from the edit flow so it can be cleaned
   * up after the post is re-published.
   */
  dTag?: string;
  /** Draft title. */
  title: string;
  /** Draft summary / subtitle. */
  summary: string;
  /** Comma-separated topic tags. */
  topics: string;
  /** Markdown content. */
  content: string;
  /** Blossom URL of the hero/cover image. */
  coverImage: string;
  /** Unix timestamp when the draft was first created. */
  createdAt: number;
  /** Unix timestamp when the draft was last updated. */
  updatedAt: number;
}

const STORAGE_KEY = 'wordstr:blog-drafts';

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Manage localStorage-based drafts for NIP-23 blog posts.
 *
 * Drafts are scoped to the currently logged-in user's pubkey so that
 * switching accounts never leaks drafts between identities. If no user is
 * logged in, the hook returns an empty list and no-op mutators.
 */
export function useBlogDrafts() {
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;
  const storageKey = pubkey ? `${STORAGE_KEY}:${pubkey}` : `${STORAGE_KEY}:anonymous`;

  const [drafts, setDrafts] = useLocalStorage<BlogDraft[]>(storageKey, []);

  const list = useMemo(() => {
    return [...drafts].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [drafts]);

  const get = useCallback(
    (id: string | undefined) => {
      if (!id) return undefined;
      return drafts.find((d) => d.id === id);
    },
    [drafts],
  );

  const save = useCallback(
    (draft: Omit<BlogDraft, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<BlogDraft, 'id'>>) => {
      if (!pubkey) return undefined;

      const now = Date.now();
      const existing =
        (draft.id ? drafts.find((d) => d.id === draft.id) : undefined) ??
        (draft.dTag ? drafts.find((d) => d.dTag === draft.dTag) : undefined);

      const next: BlogDraft = {
        ...draft,
        id: existing?.id ?? generateId(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      setDrafts((prev) => {
        const filtered = prev.filter((d) => d.id !== next.id);
        return [next, ...filtered];
      });

      return next;
    },
    [pubkey, drafts, setDrafts],
  );

  const remove = useCallback(
    (id: string) => {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    },
    [setDrafts],
  );

  const removeByDTag = useCallback(
    (dTag: string) => {
      setDrafts((prev) => prev.filter((d) => d.dTag !== dTag));
    },
    [setDrafts],
  );

  const clear = useCallback(() => {
    setDrafts([]);
  }, [setDrafts]);

  return {
    drafts: list,
    count: drafts.length,
    get,
    save,
    remove,
    removeByDTag,
    clear,
    enabled: Boolean(pubkey),
  };
}
