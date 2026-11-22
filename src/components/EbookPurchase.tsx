import { useEffect, useRef, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeCanvas } from '@/components/ui/qrcode';
import { DownloadButton } from '@/components/DownloadButton';
import { useToast } from '@/hooks/useToast';
import { useEbookPurchase } from '@/hooks/useEbookPurchase';
import { downloadFile } from '@/lib/download';
import { Check, Copy, ExternalLink, Loader2, Wallet, Zap } from 'lucide-react';

interface EbookPurchaseProps {
  /** The NIP-99 listing describing the sale. */
  listing: NostrEvent;
  /** The seller's kind-0 event, needed to locate their Lightning wallet. */
  sellerMetadataEvent: NostrEvent | undefined;
  fileUrl: string;
  filename: string;
  format: string;
}

export function EbookPurchase({
  listing,
  sellerMetadataEvent,
  fileUrl,
  filename,
  format,
}: EbookPurchaseProps) {
  const { status, invoice, priceSats, error, isChecking, start, reset } = useEbookPurchase(
    listing,
    sellerMetadataEvent,
  );
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const autoDownloaded = useRef(false);

  // Start the download as soon as the paid receipt arrives. The visible button
  // remains as a fallback in case the browser blocks a programmatic download.
  useEffect(() => {
    if (status === 'paid' && !autoDownloaded.current) {
      autoDownloaded.current = true;
      downloadFile(fileUrl, filename).catch(() => {
        // The manual Download button is still available.
      });
    }
  }, [status, fileUrl, filename]);

  const copyInvoice = async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      toast({ title: 'Invoice copied' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Could not copy invoice', variant: 'destructive' });
    }
  };

  if (status === 'paid') {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-emerald-500 text-base">
            <Check className="w-4 h-4" />
            Payment confirmed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your payment was verified on Nostr. Your {format} is ready.
          </p>
          <div className="flex flex-wrap gap-3">
            <DownloadButton url={fileUrl} filename={filename} label={`Download ${format}`} />
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in browser
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Zap className="w-4 h-4 text-purple-400" />
          Buy this ebook for {priceSats.toLocaleString()} sats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'idle' && (
          <>
            <p className="text-sm text-muted-foreground">
              Pay with Lightning over Nostr. No account or login is required.
            </p>
            <Button onClick={start} disabled={priceSats <= 0} className="w-full sm:w-auto">
              <Zap className="w-4 h-4 mr-2" />
              Pay {priceSats.toLocaleString()} sats
            </Button>
          </>
        )}

        {status === 'creating' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating your Lightning invoice…
          </div>
        )}

        {status === 'awaiting' && invoice && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan the invoice with a Lightning wallet, or open it in a wallet app on this phone.
            </p>
            <div className="flex justify-center">
              <QRCodeCanvas
                value={invoice.toUpperCase()}
                size={220}
                className="rounded-lg bg-white p-2"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={`lightning:${invoice}`}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Open in wallet
                </a>
              </Button>
              <Button variant="outline" onClick={copyInvoice}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied' : 'Copy invoice'}
              </Button>
              <Button variant="ghost" onClick={reset}>
                Cancel
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isChecking ? 'Checking for your payment receipt…' : 'Waiting for payment…'}
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this page open. The {format} downloads automatically once payment is confirmed.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
