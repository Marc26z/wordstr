import { useCallback, useMemo, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { finalizeEvent, generateSecretKey, getPublicKey, nip57, type Event } from 'nostr-tools';
import { useAppContext } from '@/hooks/useAppContext';
import { getZapEndpointInfo, isValidPurchaseReceipt } from '@/lib/lightning';
import { eventCoordinate, parsePriceSats } from '@/lib/nip99';

export type PurchaseStatus = 'idle' | 'creating' | 'awaiting' | 'paid';

interface StoredPurchase {
  buyerPubkey: string;
  invoice: string;
  startedAt: number;
  zapPubkey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStoredPurchase(key: string): StoredPurchase | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredPurchase;
    return stored.buyerPubkey && stored.invoice && stored.startedAt ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Guest Lightning checkout for a NIP-99 ebook listing.
 *
 * A temporary Nostr key is generated in the browser, so no login is required.
 * Payment is confirmed by watching for the seller's NIP-57 receipt that names
 * this temporary key and the listing.
 */
export function useEbookPurchase(
  listing: NostrEvent,
  sellerMetadataEvent: NostrEvent | undefined,
) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  const priceSats = parsePriceSats(listing);
  const listingCoordinate = eventCoordinate(listing) ?? '';
  const storageKey = `wordstr:purchase:${listingCoordinate}`;

  // Resume a checkout after the visitor returns from their wallet app.
  const restored = readStoredPurchase(storageKey);
  const [phase, setPhase] = useState<'idle' | 'creating' | 'awaiting'>(restored ? 'awaiting' : 'idle');
  const [invoice, setInvoice] = useState<string | null>(restored?.invoice ?? null);
  const [buyerPubkey, setBuyerPubkey] = useState<string | null>(restored?.buyerPubkey ?? null);
  const [startedAt, setStartedAt] = useState(restored?.startedAt ?? 0);
  const [zapPubkey, setZapPubkey] = useState<string | undefined>(restored?.zapPubkey);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    (stored: StoredPurchase) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(stored));
      } catch {
        // Storage may be unavailable in private browsing.
      }
    },
    [storageKey],
  );

  const start = useCallback(async () => {
    setError(null);
    setPhase('creating');

    try {
      if (!sellerMetadataEvent) {
        throw new Error('The seller profile is still loading. Please try again.');
      }

      const endpoint = await getZapEndpointInfo(sellerMetadataEvent);
      if (!endpoint) {
        throw new Error('The seller has not configured a Nostr-enabled Lightning address.');
      }

      const secretKey = generateSecretKey();
      const buyer = getPublicKey(secretKey);
      const millisats = priceSats * 1000;
      const relays = config.relayMetadata.relays
        .filter((relay) => relay.read || relay.write)
        .map((relay) => relay.url);

      const zapRequest = nip57.makeZapRequest({
        event: listing as Event,
        amount: millisats,
        relays: relays.length > 0 ? relays : ['wss://relay.damus.io'],
        comment: 'Ebook purchase via wordstr',
      });
      const signedRequest = finalizeEvent(zapRequest, secretKey);

      const separator = endpoint.callback.includes('?') ? '&' : '?';
      const response = await fetch(
        `${endpoint.callback}${separator}amount=${millisats}&nostr=${encodeURIComponent(JSON.stringify(signedRequest))}`,
      );
      const body: unknown = await response.json();

      if (!response.ok) {
        const reason = isRecord(body) && typeof body.reason === 'string'
          ? body.reason
          : `Lightning service returned HTTP ${response.status}`;
        throw new Error(reason);
      }

      const pr = isRecord(body) && typeof body.pr === 'string' ? body.pr : null;
      if (!pr) throw new Error('The Lightning service did not return an invoice.');

      const now = Math.floor(Date.now() / 1000);
      setBuyerPubkey(buyer);
      setInvoice(pr);
      setStartedAt(now);
      setZapPubkey(endpoint.nostrPubkey);
      persist({ buyerPubkey: buyer, invoice: pr, startedAt: now, zapPubkey: endpoint.nostrPubkey });
      setPhase('awaiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the Lightning invoice.');
      setPhase('idle');
    }
  }, [sellerMetadataEvent, priceSats, config.relayMetadata.relays, listing, persist]);

  const receiptQuery = useQuery<NostrEvent[]>({
    queryKey: ['ebook-purchase-receipt', listingCoordinate, buyerPubkey, startedAt],
    enabled: phase === 'awaiting' && Boolean(buyerPubkey && listingCoordinate),
    queryFn: async (c) => {
      return nostr.query(
        [
          {
            kinds: [9735],
            '#a': [listingCoordinate],
            since: Math.max(0, startedAt - 600),
            limit: 100,
          },
        ],
        { signal: c.signal },
      );
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  const paidReceipt = useMemo(() => {
    if (!buyerPubkey || !receiptQuery.data) return undefined;
    return receiptQuery.data.find((receipt) =>
      isValidPurchaseReceipt(receipt, {
        listingCoordinate,
        buyerPubkey,
        priceSats,
        sellerPubkey: listing.pubkey,
        zapPubkey,
      }),
    );
  }, [receiptQuery.data, buyerPubkey, listingCoordinate, priceSats, listing.pubkey, zapPubkey]);

  const status: PurchaseStatus = paidReceipt && phase === 'awaiting' ? 'paid' : phase;

  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors.
    }
    setPhase('idle');
    setInvoice(null);
    setBuyerPubkey(null);
    setStartedAt(0);
    setZapPubkey(undefined);
    setError(null);
  }, [storageKey]);

  return {
    status,
    invoice,
    priceSats,
    error,
    isChecking: receiptQuery.isFetching,
    start,
    reset,
  };
}
