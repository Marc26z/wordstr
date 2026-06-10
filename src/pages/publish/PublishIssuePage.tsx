import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePublishMagazine } from '@/hooks/usePublishMagazine';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { PublicationFilePicker } from '@/components/PublicationFilePicker';
import type { FileUploadResult } from '@/components/PublicationFilePicker';
import { LoginArea } from '@/components/auth/LoginArea';
import { KIND_MAGAZINE_ISSUE, slugify } from '@/lib/pressstr';
import { useMyMagazines } from '@/hooks/useMagazines';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

interface FormValues {
  magazineCoord: string;
  title: string;
  issue: string;
  summary: string;
  topics: string;
  publishedAt: string;
  content: string;
}

export function PublishIssuePage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMag = searchParams.get('magazine') ?? '';
  const { publishMagazineIssue } = usePublishMagazine();
  const { toast } = useToast();
  const { data: myMagazines } = useMyMagazines(user?.pubkey);
  const [coverUrl, setCoverUrl] = useState('');
  const [fileResult, setFileResult] = useState<FileUploadResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      magazineCoord: preselectedMag,
    },
  });

  const issueVal = watch('issue', '');
  const magCoord = watch('magazineCoord', '');

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    if (!fileResult?.url) {
      toast({ title: 'File required', description: 'Please upload the PDF file first.', variant: 'destructive' });
      return;
    }
    if (!coverUrl) {
      toast({ title: 'Cover required', description: 'Please upload or extract a cover image.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const d = slugify(`${values.issue}-${Date.now()}`) || `issue-${Date.now()}`;
      const event = await publishMagazineIssue({
        d,
        title: values.title.trim(),
        issue: values.issue.trim(),
        magazineCoord: values.magazineCoord,
        image: coverUrl,
        fileUrl: fileResult.url,
        mimeType: fileResult.mimeType,
        fileSize: fileResult.fileSize || undefined,
        fileHash: fileResult.fileHash || undefined,
        blossomUri: fileResult.blossomUri,
        mirrorUrls: fileResult.mirrorUrls,
        summary: values.summary.trim() || undefined,
        publishedAt: values.publishedAt ? Math.floor(new Date(values.publishedAt).getTime() / 1000) : undefined,
        topics: values.topics.split(',').map((t) => t.trim()).filter(Boolean),
        content: values.content.trim(),
      });

      const naddr = nip19.naddrEncode({
        kind: KIND_MAGAZINE_ISSUE,
        pubkey: event.pubkey,
        identifier: d,
      });

      toast({ title: 'Issue published!', description: values.title });
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
            You need a Nostr account to publish a magazine issue.
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
            <h1 className="text-2xl font-bold">New Magazine Issue</h1>
            <p className="text-sm text-muted-foreground">Upload a new issue to a magazine</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Magazine selector */}
          <div className="space-y-2">
            <Label>Magazine *</Label>
            {myMagazines && myMagazines.length > 0 ? (
              <Select
                value={magCoord}
                onValueChange={(v) => setValue('magazineCoord', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a magazine" />
                </SelectTrigger>
                <SelectContent>
                  {myMagazines.map((mag) => {
                    const title = mag.tags.find(([n]) => n === 'title')?.[1] ?? 'Untitled';
                    const d = mag.tags.find(([n]) => n === 'd')?.[1] ?? '';
                    const coord = `34609:${mag.pubkey}:${d}`;
                    return (
                      <SelectItem key={mag.id} value={coord}>
                        {title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
                You haven't published any magazines yet.{' '}
                <Link to="/publish/magazine" className="text-primary hover:underline">
                  Create one first.
                </Link>
              </div>
            )}
            <input type="hidden" {...register('magazineCoord', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue">Issue Number / Label *</Label>
              <Input
                id="issue"
                placeholder="e.g. May 2024, Vol. 3 No. 12"
                {...register('issue', { required: 'Issue number is required' })}
              />
              {errors.issue && (
                <p className="text-xs text-destructive">{errors.issue.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Publication Date</Label>
              <Input
                id="publishedAt"
                type="date"
                {...register('publishedAt')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              placeholder={issueVal ? `e.g. Bitcoin Magazine — ${issueVal}` : 'Full title for this issue'}
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* PDF upload — extracts cover automatically */}
          <PublicationFilePicker
            value={fileResult?.url}
            onUpload={setFileResult}
            onCoverExtracted={(url) => {
              if (!coverUrl) setCoverUrl(url);
            }}
            extractCover
            currentCoverUrl={coverUrl}
            label="Issue PDF *"
          />

          {/* Cover image picker (pre-filled if extracted) */}
          <CoverImagePicker
            value={coverUrl}
            onChange={setCoverUrl}
            label="Cover Image * (auto-extracted from PDF, or upload manually)"
            aspectRatio="2/3"
          />

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              placeholder="Brief description of this issue"
              rows={2}
              {...register('summary')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Editorial Notes (Markdown)</Label>
            <Textarea
              id="content"
              placeholder="Table of contents, editorial notes, etc."
              rows={4}
              {...register('content')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Topics (comma-separated)</Label>
            <Input
              id="topics"
              placeholder="bitcoin, tech, culture"
              {...register('topics')}
            />
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
                Publish Issue
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
