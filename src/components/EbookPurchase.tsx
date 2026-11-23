import type { NostrEvent } from '@nostrify/nostrify';
import { PurchaseCard } from './PurchaseCard';

export interface EbookPurchaseProps {
  listing: NostrEvent;
  sellerMetadataEvent: NostrEvent | undefined;
  fileUrl: string;
  filename: string;
  format: string;
}

/** @deprecated Use `PurchaseCard` for any NIP-99 listing. */
export function EbookPurchase(props: EbookPurchaseProps) {
  return <PurchaseCard {...props} itemLabel="ebook" />;
}
