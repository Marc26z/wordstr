import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Loader2, CheckCircle2, X, Upload } from 'lucide-react';
import { useBlossomUpload } from '@/hooks/useBlossomUpload';
import { useToast } from '@/hooks/useToast';
import { formatFileSize, sha256Hex, extractPdfCover } from '@/lib/pressstr';
import { cn } from '@/lib/utils';

export interface FileUploadResult {
  url: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  /** BUD-10 blossom: URI with xs= mirror hints, as= author, sz= size */
  blossomUri?: string;
  /** All mirror URLs where the file was successfully stored */
  mirrorUrls?: string[];
  /** If this was a PDF and no cover was provided, this is the extracted cover URL */
  extractedCoverUrl?: string;
}

interface PublicationFilePickerProps {
  value?: string;
  onUpload: (result: FileUploadResult) => void;
  onCoverExtracted?: (coverUrl: string) => void;
  /** Whether to auto-extract cover from PDF first page */
  extractCover?: boolean;
  /** The current cover URL — if set and extractCover is true, skip extraction */
  currentCoverUrl?: string;
  accept?: string;
  label?: string;
  className?: string;
}

export function PublicationFilePicker({
  value,
  onUpload,
  onCoverExtracted,
  extractCover = true,
  currentCoverUrl,
  accept = 'application/pdf,.pdf',
  label = 'PDF File',
  className,
}: PublicationFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'extracting' | 'uploading-cover' | 'uploading-file' | 'done'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const { mutateAsync: upload } = useBlossomUpload();
  const { toast } = useToast();

  const isLoading = phase !== 'idle' && phase !== 'done';

  const phaseLabel: Record<typeof phase, string> = {
    idle: '',
    extracting: 'Extracting cover from PDF…',
    'uploading-cover': 'Uploading cover image…',
    'uploading-file': 'Uploading file…',
    done: 'Upload complete!',
  };

  const handleFile = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/epub+zip',
      'application/epub',
    ];
    const isAllowed =
      allowedTypes.includes(file.type) ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.epub');

    if (!isAllowed) {
      toast({
        title: 'Invalid file',
        description: 'Please select a PDF or EPUB file.',
        variant: 'destructive',
      });
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    try {
      const mimeType =
        file.type ||
        (file.name.endsWith('.epub') ? 'application/epub+zip' : 'application/pdf');

      const isPdf = mimeType === 'application/pdf' || file.name.endsWith('.pdf');

      // 1. If it's a PDF and no cover image provided, extract first page
      let extractedCoverUrl: string | undefined;
      if (isPdf && extractCover && !currentCoverUrl && onCoverExtracted) {
        try {
          setPhase('extracting');
          const coverBlob = await extractPdfCover(file);
          const coverFile = new File(
            [coverBlob],
            `${file.name.replace(/\.pdf$/i, '')}-cover.jpg`,
            { type: 'image/jpeg' },
          );

          setPhase('uploading-cover');
          const coverResult = await upload(coverFile);
          extractedCoverUrl = coverResult.url;
          onCoverExtracted(coverResult.url);
        } catch (err) {
          // Cover extraction failure is non-fatal — just warn
          console.warn('Cover extraction failed:', err);
          toast({
            title: 'Cover extraction failed',
            description: 'Could not extract cover from PDF. You can upload one manually.',
          });
        }
      }

      // 2. Upload the main file
      setPhase('uploading-file');
      const fileHash = await sha256Hex(file);
      const result = await upload(file);

      setPhase('done');
      onUpload({
        url: result.url,
        mimeType,
        fileSize: file.size,
        fileHash,
        blossomUri: result.blossomUri,
        mirrorUrls: result.mirrorUrls,
        extractedCoverUrl,
      });
    } catch (err) {
      setPhase('idle');
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload file.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>

      <div
        className={cn(
          'relative border-2 rounded-xl p-6 transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30',
          !isLoading && !value && 'hover:border-primary/50 cursor-pointer',
        )}
        onClick={() => !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!isLoading) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{phaseLabel[phase]}</p>
            {phase === 'uploading-file' && fileSize > 0 && (
              <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
            )}
            <Progress value={
              phase === 'extracting' ? 20 :
              phase === 'uploading-cover' ? 50 :
              phase === 'uploading-file' ? 80 : 100
            } className="w-full max-w-xs" />
          </div>
        ) : value ? (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName || 'File uploaded'}</p>
              <p className="text-xs text-muted-foreground break-all line-clamp-1">{value}</p>
              {fileSize > 0 && (
                <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPhase('idle'); setFileName(''); setFileSize(0); onUpload({ url: '', mimeType: '', fileSize: 0, fileHash: '' }); }}
              className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? 'Drop file here' : 'Upload file'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground">PDF or EPUB</p>
            </div>
          </div>
        )}
      </div>

      {!isLoading && !value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="text-xs"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Browse files
        </Button>
      )}

      {/* 
        No capture attribute: on mobile, this lets users pick from files (not force camera).
        accept attribute includes both MIME types and extensions for maximum compatibility.
      */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,application/epub+zip,.epub"
        className="hidden"
        onChange={handleInputChange}
        aria-label={`Upload ${label}`}
      />
    </div>
  );
}
