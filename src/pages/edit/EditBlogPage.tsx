import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { blogPostUrl } from '@/lib/blogUrl';
import { useForm } from 'react-hook-form';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { HeroImageUploader } from '@/components/HeroImageUploader';
import { KIND_BLOG_POST } from '@/hooks/useBlogs';
import { ArrowLeft, Loader2, FileEdit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import NotFound from '@/pages/NotFound';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormValues {
  title: string;
  summary: string;
  topics: string;
  content: string;
}

function getTag(event: NostrEvent, name: string) {
  return event.tags.find(([n]) => n === name)?.[1] ?? '';
}

export function EditBlogPage() {
  const { naddr } = useParams<{ naddr: string }>();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { toast } = useToast();
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');

  // Decode the naddr to find the event
  let decoded: { kind: number; pubkey: string; identifier: string } | null = null;
  try {
    const d = naddr ? nip19.decode(naddr) : null;
    if (d?.type === 'naddr') decoded = d.data;
  } catch {
    // ignore
  }

  const { data: event, isLoading } = useQuery<NostrEvent | undefined>({
    queryKey: ['blog-post-edit', decoded?.pubkey, decoded?.identifier],
    enabled: Boolean(decoded),
    queryFn: async (c) => {
      if (!decoded) return undefined;
      const events = await nostr.query(
        [{ kinds: [KIND_BLOG_POST], authors: [decoded.pubkey], '#d': [decoded.identifier], limit: 1 }],
        { signal: c.signal },
      );
      return events[0];
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const content = watch('content', '');

  // Pre-fill the form when the event loads
  useEffect(() => {
    if (event) {
      reset({
        title: getTag(event, 'title'),
        summary: getTag(event, 'summary'),
        topics: event.tags
          .filter(([n]) => n === 't')
          .map(([, v]) => v)
          .join(', '),
        content: event.content,
      });
      setCoverImage(getTag(event, 'image'));
    }
  }, [event, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!user || !event || !decoded) return;
    setIsSubmitting(true);
    try {
      const tags: string[][] = [
        ['d', decoded.identifier],
        ['title', values.title.trim()],
        ['published_at', getTag(event, 'published_at') || String(Math.floor(Date.now() / 1000))],
        ['alt', `Blog post: ${values.title.trim()}`],
      ];

      if (coverImage) tags.push(['image', coverImage]);
      if (values.summary.trim()) tags.push(['summary', values.summary.trim()]);

      const topicList = values.topics
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      for (const t of topicList) {
        tags.push(['t', t]);
      }

      const updated = await publishEvent({
        kind: KIND_BLOG_POST,
        content: values.content.trim(),
        tags,
      });

      toast({ title: 'Post updated!', description: values.title });
      navigate(blogPostUrl(updated.pubkey, decoded.identifier));
    } catch (err) {
      toast({
        title: 'Failed to update',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!naddr || !decoded) return <NotFound />;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (!event) return <NotFound />;
  if (user?.pubkey !== event.pubkey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Not your post</h2>
          <p className="text-muted-foreground">You can only edit your own blog posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to={decoded ? blogPostUrl(decoded.pubkey, decoded.identifier) : '/'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Blog Post</h1>
            <p className="text-sm text-muted-foreground">Update your long-form article on Nostr</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <HeroImageUploader value={coverImage} onChange={setCoverImage} />

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              className="text-lg font-medium"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary / Subtitle</Label>
            <Textarea id="summary" rows={2} {...register('summary')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Tags (comma-separated)</Label>
            <Input id="topics" placeholder="bitcoin, nostr, tech" {...register('topics')} />
          </div>

          <div className="space-y-2">
            <Label>Content (Markdown) *</Label>
            <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as 'write' | 'preview')}>
              <TabsList className="mb-2">
                <TabsTrigger value="write" className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <FileEdit className="w-3.5 h-3.5" />
                  Write
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  rows={20}
                  className="font-mono text-sm resize-y min-h-[300px]"
                  {...register('content', { required: 'Content is required' })}
                />
                {errors.content && (
                  <p className="text-xs text-destructive mt-1">{errors.content.message}</p>
                )}
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-[300px] rounded-md border bg-card p-4">
                  {content ? (
                    <article className="prose prose-sm prose-purple dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </article>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">Nothing to preview yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <FileEdit className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
