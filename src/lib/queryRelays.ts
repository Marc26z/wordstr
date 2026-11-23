import { NSet, type NostrEvent, type NostrFilter, type NPool } from '@nostrify/nostrify';

/** How long to wait for a single relay before using whatever it has returned. */
const RELAY_TIMEOUT_MS = 15_000;

function publishedAt(event: NostrEvent): number {
  const tag = event.tags.find(([name]) => name === 'published_at')?.[1];
  return Number(tag) || event.created_at;
}

/**
 * Query each relay independently, then merge the results.
 *
 * `NPool.group().query()` stops as soon as one relay reaches EOSE. That is a
 * problem for owner feeds: a fast relay holding only a couple of recent posts
 * can end the query before a slower relay returns the rest. Querying relays
 * separately avoids that and lets `NSet` deduplicate events and keep the newest
 * version of every replaceable/addressable event.
 */
export async function queryRelaysMerged(
  pool: NPool,
  urls: string[],
  filters: NostrFilter[],
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<NostrEvent[]> {
  const relayUrls = [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
  if (relayUrls.length === 0) return [];

  const timeoutMs = options.timeoutMs ?? RELAY_TIMEOUT_MS;

  const perRelayResults = await Promise.all(
    relayUrls.map(async (url) => {
      const controller = new AbortController();
      const abort = () => controller.abort();

      if (options.signal?.aborted) {
        abort();
      } else {
        options.signal?.addEventListener('abort', abort, { once: true });
      }

      const timer = setTimeout(abort, timeoutMs);

      try {
        return await pool.relay(url).query(filters, { signal: controller.signal });
      } catch {
        // A failed relay simply contributes no events; others still count.
        return [] as NostrEvent[];
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
      }
    }),
  );

  const events = new NSet();
  for (const result of perRelayResults) {
    for (const event of result) {
      events.add(event);
    }
  }

  return [...events].sort((a, b) => publishedAt(b) - publishedAt(a));
}
