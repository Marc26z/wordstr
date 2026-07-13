/**
 * HeroImageUploader
 *
 * A full-width 16:9 drag-and-drop image uploader for blog hero images.
 * Uploads directly to Blossom servers via useBlossomUpload and returns the URL.
 */
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useBlossomUpload } from '@/hooks/useBlossomUpload';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface HeroImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function HeroImageUploader({ value, onChange, className }: HeroImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { mutateAsync: upload, isPending } = useBlossomUpload();
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file (JPEG, PNG, WebP, etc.).',
        variant: 'destructive',
      });
      return;
    }
    try {
      const result = await upload(file);
      onChange(result.url);
      toast({ title: 'Hero image uploaded!', description: 'Image stored on Blossom.' });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload image. Try again.',
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
      <label className="text-sm font-medium text-foreground">
        Hero Image
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          Uploaded to Blossom · 16:9 recommended
        </span>
      </label>

      <div
        className={cn(
          'relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer',
          'aspect-video',
          isDragging
            ? 'border-purple-500 bg-purple-500/5 scale-[1.01]'
            : value
              ? 'border-purple-500/30 hover:border-purple-500/60'
              : 'border-dashed border-muted-foreground/30 hover:border-purple-400/60 hover:bg-purple-500/5',
        )}
        onClick={() => !isPending && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload hero image"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        {/* Preview */}
        {value && !isPending && (
          <>
            <img
              src={value}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 gap-3">
              <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Change image
              </span>
            </div>
            {/* Remove button */}
            <button
              type="button"
              aria-label="Remove hero image"
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 rounded-full p-1.5 text-white transition-colors shadow-md"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Upload spinner (while uploading, over existing image or empty) */}
        {isPending && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            <p className="text-white/80 text-sm font-medium">Uploading to Blossom…</p>
          </div>
        )}

        {/* Empty state */}
        {!value && !isPending && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground p-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-1">
              <ImageIcon className="w-8 h-8 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/80">
                {isDragging ? 'Drop image here' : 'Click or drag & drop to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP, GIF · Uploaded to Blossom
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons below */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 text-xs"
        >
          {isPending ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading…</>
          ) : (
            <><Upload className="w-3.5 h-3.5 mr-1.5" />{value ? 'Replace image' : 'Choose image'}</>
          )}
        </Button>
        {value && !isPending && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Remove
          </Button>
        )}
        {value && !isPending && (
          <span className="text-xs text-muted-foreground truncate max-w-xs hidden sm:block">
            ✓ Stored on Blossom
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        aria-label="Upload hero image file"
      />
    </div>
  );
}
