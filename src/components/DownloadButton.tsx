import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { downloadFile } from '@/lib/download';

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
      await downloadFile(url, filename);
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
