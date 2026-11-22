import { bech32 } from '@scure/base';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip57, verifyEvent, type Event } from 'nostr-tools';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export interface ZapEndpointInfo {
  /** LNURL-pay callback used to request an invoice. */
  callback: string;
  /** Pubkey the seller's wallet uses to sign zap receipts. */
  nostrPubkey: string;
}

/**
 * Resolve a seller's NIP-57 zap endpoint from their kind-0 metadata event.
 * Only HTTPS LNURL endpoints that support Nostr zaps are accepted.
 */
export async function getZapEndpointInfo(metadata: NostrEvent): Promise<ZapEndpointInfo | null> {
  let parsed: { lud06?: unknown; lud16?: unknown };
  try {
    parsed = JSON.parse(metadata.content) as { lud06?: unknown; lud16?: unknown };
  } catch {
    return null;
  }

  let lnurl: string;
  if (typeof parsed.lud16 === 'string' && parsed.lud16) {
    const at = parsed.lud16.lastIndexOf('@');
    if (at < 1) return null;
    const name = parsed.lud16.slice(0, at);
    const domain = parsed.lud16.slice(at + 1);
    if (!/^[a-z0-9.-]+$/i.test(domain)) return null;
    lnurl = `https://${domain}/.well-known/lnurlp/${encodeURIComponent(name)}`;
  } else if (typeof parsed.lud06 === 'string' && parsed.lud06) {
    try {
      const { bytes } = bech32.decodeToBytes(parsed.lud06, 1000);
      lnurl = new TextDecoder().decode(bytes);
    } catch {
      return null;
    }
  } else {
    return null;
  }

  if (!lnurl.startsWith('https://')) return null;

  try {
    const response = await fetch(lnurl);
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isRecord(body)) return null;

    const { callback, nostrPubkey, allowsNostr } = body;
    if (allowsNostr !== true) return null;
    if (typeof callback !== 'string' || !callback.startsWith('https://')) return null;
    if (typeof nostrPubkey !== 'string' || !/^[a-f0-9]{64}$/.test(nostrPubkey)) return null;

    return { callback, nostrPubkey };
  } catch {
    return null;
  }
}

export interface PurchaseReceiptCheck {
  listingCoordinate: string;
  buyerPubkey: string;
  sellerPubkey: string;
  priceSats: number;
  /** The wallet pubkey advertised by the seller's LNURL endpoint. */
  zapPubkey?: string;
}

/**
 * Validate that a NIP-57 receipt pays this specific buyer for this listing.
 * A receipt from another buyer (or for another listing) is rejected.
 */
export function isValidPurchaseReceipt(receipt: NostrEvent, check: PurchaseReceiptCheck): boolean {
  const hasTag = (name: string, value: string) =>
    receipt.tags.some(([n, v]) => n === name && v === value);

  if (!hasTag('a', check.listingCoordinate)) return false;
  if (!hasTag('p', check.sellerPubkey)) return false;

  if (check.zapPubkey && receipt.pubkey !== check.zapPubkey) return false;

  const description = receipt.tags.find(([n]) => n === 'description')?.[1];
  let zapRequest: Event | null = null;
  if (description) {
    try {
      const candidate = JSON.parse(description) as Event;
      if (verifyEvent(candidate)) zapRequest = candidate;
    } catch {
      // Ignore malformed descriptions.
    }
  }

  // The receipt must identify our temporary buyer key, either directly with a
  // `P` tag or through the signed zap request in the `description` tag.
  const senderTag = receipt.tags.find(([n]) => n === 'P')?.[1];
  if (senderTag !== check.buyerPubkey && zapRequest?.pubkey !== check.buyerPubkey) {
    return false;
  }

  let paidSats = 0;
  const bolt11 = receipt.tags.find(([n]) => n === 'bolt11')?.[1];
  if (bolt11) {
    try {
      paidSats = nip57.getSatoshisAmountFromBolt11(bolt11);
    } catch {
      paidSats = 0;
    }
  }
  if (paidSats < check.priceSats && zapRequest) {
    const amountTag = zapRequest.tags.find(([n]) => n === 'amount')?.[1];
    const millisats = Number(amountTag ?? 0);
    if (Number.isFinite(millisats)) paidSats = Math.floor(millisats / 1000);
  }

  return paidSats >= check.priceSats;
}
