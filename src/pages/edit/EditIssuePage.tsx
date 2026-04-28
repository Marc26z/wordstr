import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useForm } from 'react-hook-form';
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
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { PublicationFilePicker } from '@/components/PublicationFilePicker';
import type { FileUploadResult } from '@/components/PublicationFilePicker';
import { KIND_MAGAZINE_ISSUE } from '@/lib/pressstr';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import NotFound from '@/pages/NotFound';

interface FormValues {
  title: string;
  issue: string;
  summary: string;
  topics: string;
  publishedAt: string;
  content: string;
}

function getTag(event: NostrEvent, name: string) {
  return event.tags.find(([n]) => n === name)?.[1] ?? '';
}

export function EditIssuePage() {
  const { naddr } = useParams<{ naddr: string }>();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { publishMagazineIssue } = usePublishMagazine();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  let decoded: { pubkey: string; identifier: string } | null = null;
  try {
    const d = nip19.decode(naddr ?? '');
    if (d.type === 'naddr' && d.data.kind === KIND_MAGAZINE_ISSUE) {
      decoded = { pubkey: d.data.pubkey, identifier: d.data.identifier };
    }
  } catch { /* handled below */ }

  const { data: event, isLoading } = useQuery<NostrEvent | undefined>({
    queryKey: ['pressstr', 'issue', decoded?.pubkey, decoded?.identifier],
    enabled: Boolean(decoded),
    queryFn: async (c) => {
      if (!decoded) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_MAGAZINE_ISSUE], authors: [decoded.pubkey], '#d': [decoded.identifier], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });

  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [fileResult, setFileResult] = useState<FileUploadResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    values: event
      ? {
          title: getTag(event, 'title'),
          issue: getTag(event, 'issue'),
          summary: getTag(event, 'summary'),
          topics: event.tags.filter(([n]) => n === 't').map(([, v]) => v).join(', '),
          publishedAt: getTag(event, 'published_at')
            ? new Date(Number(getTag(event, 'published_at')) * 1000).toISOString().split('T')[0]
            : '',
          content: event.content,
        }
      : undefined,
  });

  const effectiveCover = coverUrl ?? (event ? getTag(event, 'image') : '');
  const effectiveFileUrl = fileResult?.url ?? (event ? getTag(event, 'url') : '');
  const effectiveMime = fileResult?.mimeType ?? (event ? getTag(event, 'm') : 'application/pdf');
  const effectiveSize = fileResult?.fileSize ?? (event ? Number(getTag(event, 'size')) || undefined : undefined);
  const effectiveHash = fileResult?.fileHash ?? (event ? getTag(event, 'x') || undefined : undefined);

  const onSubmit = async (values: FormValues) => {
    if (!user || !event) return;
    if (!effectiveCover) {
      toast({ title: 'Cover required', description: 'Please provide a cover image.', variant: 'destructive' });
      return;
    }
    if (!effectiveFileUrl) {
      toast({ title: 'File required', description: 'Please upload the PDF file.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const d = getTag(event, 'd');
      const magCoord = getTag(event, 'a');
      const updated = await publishMagazineIssue({
        d,
        title: values.title.trim(),
        issue: values.issue.trim(),
        magazineCoord: magCoord,
        image: effectiveCover,
        fileUrl: effectiveFileUrl,
        mimeType: effectiveMime || 'application/pdf',
        fileSize: effectiveSize,
        fileHash: effectiveHash,
        summary: values.summary.trim() || undefined,
        publishedAt: values.publishedAt ? Math.floor(new Date(values.publishedAt).getTime() / 1000) : undefined,
        topics: values.topics.split(',').map((t) => t.trim()).filter(Boolean),
        content: values.content.trim(),
      });

      const newNaddr = nip19.naddrEncode({ kind: KIND_MAGAZINE_ISSUE, pubkey: updated.pubkey, identifier: d });
      toast({ title: 'Issue updated!' });
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
    <div className="p-8 text-center text-muted-foreground">You don't have permission to edit this issue.</div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to={`/${naddr}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Issue</h1>
            <p className="text-sm text-muted-foreground">Update this issue's details or replace the file</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue">Issue Number / Label *</Label>
              <Input id="issue" {...register('issue', { required: 'Issue label is required' })} />
              {errors.issue && <p className="text-xs text-destructive">{errors.issue.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Publication Date</Label>
              <Input id="publishedAt" type="date" {...register('publishedAt')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input id="title" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Replace PDF (optional) */}
          <PublicationFilePicker
            value={effectiveFileUrl}
            onUpload={setFileResult}
            onCoverExtracted={(url) => { if (!coverUrl && !getTag(event, 'image')) setCoverUrl(url); }}
            extractCover
            currentCoverUrl={effectiveCover}
            label="Replace PDF (optional — leave as-is to keep existing)"
          />

          <CoverImagePicker
            value={effectiveCover}
            onChange={setCoverUrl}
            label="Cover Image"
            aspectRatio="2/3"
          />

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" rows={2} {...register('summary')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Editorial Notes (Markdown)</Label>
            <Textarea id="content" rows={4} {...register('content')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Topics (comma-separated)</Label>
            <Input id="topics" placeholder="bitcoin, tech, culture" {...register('topics')} />
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
