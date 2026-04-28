import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { useBlossomUpload } from '@/hooks/useBlossomUpload';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface CoverImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: '2/3' | '3/2' | '1/1';
  className?: string;
}

export function CoverImagePicker({
  value,
  onChange,
  label = 'Cover Image',
  aspectRatio = '2/3',
  className,
}: CoverImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { mutateAsync: upload, isPending } = useBlossomUpload();
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    try {
      const result = await upload(file);
      onChange(result.url);
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload image.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const aspectClass = {
    '2/3': 'aspect-[2/3]',
    '3/2': 'aspect-[3/2]',
    '1/1': 'aspect-square',
  }[aspectRatio];

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        className={cn(
          'relative border-2 rounded-xl overflow-hidden cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30 hover:border-primary/50',
          aspectClass,
          'max-w-48',
        )}
        onClick={() => !isPending && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img src={value} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-xs font-medium">Change</span>
            </div>
            <button
              type="button"
              className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 rounded-full p-0.5 text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground p-4">
            {isPending ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs text-center">
                  {isDragging ? 'Drop here' : 'Click or drag to upload'}
                </span>
              </>
            )}
          </div>
        )}
        {isPending && value && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
      </div>
      {/* Hidden file input — accept only images, no capture on desktop */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        aria-label={`Upload ${label}`}
      />
      {!value && !isPending && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="text-xs"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
          Choose image
        </Button>
      )}
    </div>
  );
}
