import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePublishMagazine } from '@/hooks/usePublishMagazine';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { PublicationFilePicker } from '@/components/PublicationFilePicker';
import type { FileUploadResult } from '@/components/PublicationFilePicker';
import { LoginArea } from '@/components/auth/LoginArea';
import { KIND_EBOOK, slugify } from '@/lib/pressstr';
import { saleListingD } from '@/lib/nip99';
import { ArrowLeft, Loader2, BookOpen, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

interface FormValues {
  title: string;
  summary: string;
  content: string;
  topics: string;
  language: string;
  isbn: string;
  publishedAt: string;
  priceSats: string;
  authors: { name: string }[];
}

export function PublishEbookPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { publishEbook, publishSaleListing } = usePublishMagazine();
  const { toast } = useToast();
  const [coverUrl, setCoverUrl] = useState('');
  const [fileResult, setFileResult] = useState<FileUploadResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      language: 'en',
      authors: [{ name: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'authors' });
  const title = watch('title', '');

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    if (!fileResult?.url) {
      toast({ title: 'File required', description: 'Please upload the ebook file first.', variant: 'destructive' });
      return;
    }
    if (!coverUrl) {
      toast({ title: 'Cover required', description: 'Please upload or extract a cover image.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const d = slugify(values.title) || `ebook-${Date.now()}`;
      const priceSats = Math.max(0, Math.floor(Number(values.priceSats) || 0));
      const publishedAt = values.publishedAt
        ? Math.floor(new Date(values.publishedAt).getTime() / 1000)
        : undefined;
      const topics = values.topics.split(',').map((t) => t.trim()).filter(Boolean);

      const event = await publishEbook({
        d,
        title: values.title.trim(),
        image: coverUrl,
        fileUrl: fileResult.url,
        mimeType: fileResult.mimeType,
        authors: values.authors.map((a) => a.name).filter(Boolean),
        summary: values.summary.trim() || undefined,
        content: values.content.trim(),
        publishedAt,
        fileSize: fileResult.fileSize || undefined,
        fileHash: fileResult.fileHash || undefined,
        blossomUri: fileResult.blossomUri,
        mirrorUrls: fileResult.mirrorUrls,
        topics,
        language: values.language.trim() || undefined,
        isbn: values.isbn.trim() || undefined,
        priceSats,
      });

      if (priceSats > 0) {
        try {
          await publishSaleListing({
            d: saleListingD(KIND_EBOOK, d),
            title: values.title.trim(),
            summary: values.summary.trim() || undefined,
            image: coverUrl,
            priceSats,
            publishedAt,
            coordinate: `${KIND_EBOOK}:${event.pubkey}:${d}`,
            contentKind: KIND_EBOOK,
            topics,
            content: values.content.trim(),
          });
        } catch (listingError) {
          console.error(listingError);
          toast({
            title: 'Sale listing not published',
            description: 'The ebook was published, but its NIP-99 listing could not be saved. Edit the ebook to try again.',
            variant: 'destructive',
          });
        }
      }

      const naddr = nip19.naddrEncode({
        kind: KIND_EBOOK,
        pubkey: event.pubkey,
        identifier: d,
      });

      toast({ title: 'Ebook published!', description: values.title });
      navigate(`/${naddr}`);
    } catch (err) {
      toast({
        title: 'Failed to publish',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Log in to publish</h2>
          <p className="text-muted-foreground text-sm mb-4">
            You need a Nostr account to publish an ebook.
          </p>
        </div>
        <LoginArea className="max-w-60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/publish">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Ebook</h1>
            <p className="text-sm text-muted-foreground">Publish an ebook (PDF or EPUB) on Nostr</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. The Bitcoin Standard"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
            {title && (
              <p className="text-xs text-muted-foreground">
                ID: <code className="bg-muted px-1 rounded">{slugify(title) || '—'}</code>
              </p>
            )}
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <Label>Authors</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder={`Author ${index + 1}`}
                  {...register(`authors.${index}.name`)}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '' })}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add author
            </Button>
          </div>

          {/* File upload — extracts cover from PDF automatically */}
          <PublicationFilePicker
            value={fileResult?.url}
            onUpload={setFileResult}
            onCoverExtracted={(url) => {
              if (!coverUrl) setCoverUrl(url);
            }}
            extractCover
            currentCoverUrl={coverUrl}
            accept="application/pdf,.pdf,application/epub+zip,.epub"
            label="Ebook File (PDF or EPUB) *"
          />

          {/* Cover image */}
          <CoverImagePicker
            value={coverUrl}
            onChange={setCoverUrl}
            label="Cover Image * (auto-extracted from PDF, or upload manually)"
            aspectRatio="2/3"
          />

          <div className="space-y-2">
            <Label htmlFor="summary">Short Description</Label>
            <Textarea
              id="summary"
              placeholder="A short synopsis or blurb"
              rows={2}
              {...register('summary')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Full Description (Markdown)</Label>
            <Textarea
              id="content"
              placeholder="Extended description, table of contents, etc."
              rows={4}
              {...register('content')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Publication Date</Label>
              <Input
                id="publishedAt"
                type="date"
                {...register('publishedAt')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                placeholder="en"
                maxLength={5}
                {...register('language')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topics">Topics (comma-separated)</Label>
              <Input
                id="topics"
                placeholder="bitcoin, economics"
                {...register('topics')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                placeholder="978-..."
                {...register('isbn')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceSats">Price in satoshis</Label>
            <Input
              id="priceSats"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
              {...register('priceSats')}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty or 0 to give this ebook away for free. A paid ebook gets a NIP-99 listing; visitors pay with Lightning without logging in.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !fileResult?.url}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Publish Ebook
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
