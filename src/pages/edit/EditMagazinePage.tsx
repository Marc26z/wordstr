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
import { KIND_MAGAZINE } from '@/lib/pressstr';
import { ArrowLeft, Loader2, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import NotFound from '@/pages/NotFound';

interface FormValues {
  title: string;
  summary: string;
  topics: string;
  language: string;
  url: string;
  content: string;
}

function getTag(event: NostrEvent, name: string) {
  return event.tags.find(([n]) => n === name)?.[1] ?? '';
}

export function EditMagazinePage() {
  const { naddr } = useParams<{ naddr: string }>();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { publishMagazine } = usePublishMagazine();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Decode naddr
  let decoded: { pubkey: string; identifier: string } | null = null;
  try {
    const d = nip19.decode(naddr ?? '');
    if (d.type === 'naddr' && d.data.kind === KIND_MAGAZINE) {
      decoded = { pubkey: d.data.pubkey, identifier: d.data.identifier };
    }
  } catch { /* handled below */ }

  const { data: event, isLoading } = useQuery<NostrEvent | undefined>({
    queryKey: ['pressstr', 'magazine', decoded?.pubkey, decoded?.identifier],
    enabled: Boolean(decoded),
    queryFn: async (c) => {
      if (!decoded) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_MAGAZINE], authors: [decoded.pubkey], '#d': [decoded.identifier], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });

  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    values: event
      ? {
          title: getTag(event, 'title'),
          summary: getTag(event, 'summary'),
          topics: event.tags.filter(([n]) => n === 't').map(([, v]) => v).join(', '),
          language: getTag(event, 'l'),
          url: getTag(event, 'url'),
          content: event.content,
        }
      : undefined,
  });

  const effectiveLogo = logoUrl ?? (event ? getTag(event, 'image') : '');

  const onSubmit = async (values: FormValues) => {
    if (!user || !event) return;
    setIsSubmitting(true);
    try {
      const d = getTag(event, 'd');
      const updated = await publishMagazine({
        d,
        title: values.title.trim(),
        image: effectiveLogo || undefined,
        summary: values.summary.trim() || undefined,
        topics: values.topics.split(',').map((t) => t.trim()).filter(Boolean),
        language: values.language.trim() || undefined,
        url: values.url.trim() || undefined,
        content: values.content.trim(),
      });

      const newNaddr = nip19.naddrEncode({ kind: KIND_MAGAZINE, pubkey: updated.pubkey, identifier: d });
      toast({ title: 'Magazine updated!' });
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
    <div className="p-8 text-center text-muted-foreground">You don't have permission to edit this magazine.</div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to={`/${naddr}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Magazine</h1>
            <p className="text-sm text-muted-foreground">Update your magazine details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CoverImagePicker
            value={effectiveLogo}
            onChange={setLogoUrl}
            label="Magazine Logo / Masthead"
            aspectRatio="3/2"
          />

          <div className="space-y-2">
            <Label htmlFor="title">Magazine Title *</Label>
            <Input id="title" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

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
              <Label htmlFor="topics">Topics (comma-separated)</Label>
              <Input id="topics" placeholder="bitcoin, tech, culture" {...register('topics')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" placeholder="en" maxLength={5} {...register('language')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input id="url" type="url" placeholder="https://yourmagazine.com" {...register('url')} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              : <><Newspaper className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
