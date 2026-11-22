import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePublishMagazine } from '@/hooks/usePublishMagazine';
import { useEbookListing } from '@/hooks/useEbookListing';
import { parsePriceSats } from '@/lib/nip99';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { PublicationFilePicker } from '@/components/PublicationFilePicker';
import type { FileUploadResult } from '@/components/PublicationFilePicker';
import { KIND_EBOOK } from '@/lib/pressstr';
import { ArrowLeft, Loader2, BookOpen, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import NotFound from '@/pages/NotFound';

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

function getTag(event: NostrEvent, name: string) {
  return event.tags.find(([n]) => n === name)?.[1] ?? '';
}

export function EditEbookPage() {
  const { naddr } = useParams<{ naddr: string }>();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { publishEbook, publishEbookListing } = usePublishMagazine();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  let decoded: { pubkey: string; identifier: string } | null = null;
  try {
    const d = nip19.decode(naddr ?? '');
    if (d.type === 'naddr' && d.data.kind === KIND_EBOOK) {
      decoded = { pubkey: d.data.pubkey, identifier: d.data.identifier };
    }
  } catch { /* handled below */ }

  const { data: event, isLoading } = useQuery<NostrEvent | undefined>({
    queryKey: ['pressstr', 'ebook', decoded?.pubkey, decoded?.identifier],
    enabled: Boolean(decoded),
    queryFn: async (c) => {
      if (!decoded) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_EBOOK], authors: [decoded.pubkey], '#d': [decoded.identifier], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });

  const { data: listing } = useEbookListing(event);

  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [fileResult, setFileResult] = useState<FileUploadResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    values: event
      ? {
          title: getTag(event, 'title'),
          summary: getTag(event, 'summary'),
          content: event.content,
          topics: event.tags.filter(([n]) => n === 't').map(([, v]) => v).join(', '),
          language: getTag(event, 'l'),
          isbn: getTag(event, 'isbn'),
          publishedAt: getTag(event, 'published_at')
            ? new Date(Number(getTag(event, 'published_at')) * 1000).toISOString().split('T')[0]
            : '',
          priceSats: listing ? String(parsePriceSats(listing)) : '',
          authors: event.tags.filter(([n]) => n === 'author').map(([, v]) => ({ name: v })),
        }
      : undefined,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'authors' });

  const effectiveCover = coverUrl ?? (event ? getTag(event, 'image') : '');
  const effectiveFileUrl = fileResult?.url ?? (event ? getTag(event, 'url') : '');
  const effectiveMime = fileResult?.mimeType ?? (event ? getTag(event, 'm') : 'application/pdf');
  const effectiveSize = fileResult?.fileSize ?? (event ? Number(getTag(event, 'size')) || undefined : undefined);
  const effectiveHash = fileResult?.fileHash ?? (event ? getTag(event, 'x') || undefined : undefined);
  // Mirror URLs: from new upload if available, otherwise from existing event tags
  const effectiveMirrorUrls = fileResult?.mirrorUrls ?? (event
    ? event.tags.filter(([n]) => n === 'url').map(([, v]) => v)
    : undefined);
  const effectiveBlossomUri = fileResult?.blossomUri ?? (event
    ? event.tags.find(([n]) => n === 'blossom')?.[1]
    : undefined);

  const onSubmit = async (values: FormValues) => {
    if (!user || !event) return;
    if (!effectiveCover) {
      toast({ title: 'Cover required', description: 'Please provide a cover image.', variant: 'destructive' });
      return;
    }
    if (!effectiveFileUrl) {
      toast({ title: 'File required', description: 'Please upload the ebook file.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const d = getTag(event, 'd');
      const priceSats = Math.max(0, Math.floor(Number(values.priceSats) || 0));
      const publishedAt = values.publishedAt
        ? Math.floor(new Date(values.publishedAt).getTime() / 1000)
        : undefined;
      const topics = values.topics.split(',').map((t) => t.trim()).filter(Boolean);

      const updated = await publishEbook({
        d,
        title: values.title.trim(),
        image: effectiveCover,
        fileUrl: effectiveFileUrl,
        mimeType: effectiveMime || 'application/pdf',
        authors: values.authors.map((a) => a.name).filter(Boolean),
        summary: values.summary.trim() || undefined,
        content: values.content.trim(),
        publishedAt,
        fileSize: effectiveSize,
        fileHash: effectiveHash,
        blossomUri: effectiveBlossomUri,
        mirrorUrls: effectiveMirrorUrls,
        topics,
        language: values.language.trim() || undefined,
        isbn: values.isbn.trim() || undefined,
        priceSats,
      });

      // Keep the NIP-99 listing in sync. Publishing a listing with price 0 and
      // status `sold` effectively turns the ebook back into a free download.
      if (priceSats > 0 || listing) {
        try {
          await publishEbookListing({
            d,
            title: values.title.trim(),
            summary: values.summary.trim() || undefined,
            image: effectiveCover,
            priceSats,
            publishedAt,
            ebookCoord: `${KIND_EBOOK}:${updated.pubkey}:${d}`,
            topics,
            content: values.content.trim(),
            status: priceSats > 0 ? 'active' : 'sold',
          });
        } catch (listingError) {
          console.error(listingError);
          toast({
            title: 'Sale listing not updated',
            description: 'The ebook was saved, but its NIP-99 listing could not be updated.',
            variant: 'destructive',
          });
        }
      }

      const newNaddr = nip19.naddrEncode({ kind: KIND_EBOOK, pubkey: updated.pubkey, identifier: d });
      toast({ title: 'Ebook updated!' });
      navigate(`/${newNaddr}`);
    } catch (err) {
      toast({ title: 'Failed to update', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!decoded) return <NotFound />;
  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
  if (!event) return <NotFound />;
  if (user?.pubkey !== event.pubkey) return (
    <div className="p-8 text-center text-muted-foreground">You don't have permission to edit this ebook.</div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to={`/${naddr}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Ebook</h1>
            <p className="text-sm text-muted-foreground">Update this ebook's details or replace the file</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <Label>Authors</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input placeholder={`Author ${index + 1}`} {...register(`authors.${index}.name`)} />
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="flex-shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '' })} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Add author
            </Button>
          </div>

          {/* Replace file (optional) */}
          <PublicationFilePicker
            value={effectiveFileUrl}
            onUpload={setFileResult}
            onCoverExtracted={(url) => { if (!coverUrl && !getTag(event, 'image')) setCoverUrl(url); }}
            extractCover
            currentCoverUrl={effectiveCover}
            accept="application/pdf,.pdf,application/epub+zip,.epub"
            label="Replace Ebook File (optional — leave as-is to keep existing)"
          />

          <CoverImagePicker
            value={effectiveCover}
            onChange={setCoverUrl}
            label="Cover Image"
            aspectRatio="2/3"
          />

          <div className="space-y-2">
            <Label htmlFor="summary">Short Description</Label>
            <Textarea id="summary" rows={2} {...register('summary')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Full Description (Markdown)</Label>
            <Textarea id="content" rows={4} {...register('content')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Publication Date</Label>
              <Input id="publishedAt" type="date" {...register('publishedAt')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" placeholder="en" maxLength={5} {...register('language')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topics">Topics (comma-separated)</Label>
              <Input id="topics" placeholder="bitcoin, economics" {...register('topics')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" placeholder="978-..." {...register('isbn')} />
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
              Leave empty or 0 to make this ebook a free download.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              : <><BookOpen className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
