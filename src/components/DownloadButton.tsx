import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface DownloadButtonProps {
  url: string;
  filename: string;
  label?: string;
}

/**
 * Fetches a cross-origin file as a Blob and triggers a real browser download.
 * The HTML `download` attribute is ignored for cross-origin URLs (e.g. Blossom),
 * so we must fetch + createObjectURL to force a Save dialog on all browsers.
 */
export function DownloadButton({ url, filename, label = 'Download' }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke after a short delay to let the browser start the download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not download file.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {isDownloading ? 'Downloading…' : label}
    </Button>
  );
}
