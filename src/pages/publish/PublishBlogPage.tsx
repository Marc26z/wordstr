import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { HeroImageUploader } from '@/components/HeroImageUploader';
import { LoginArea } from '@/components/auth/LoginArea';
import { slugify } from '@/lib/pressstr';
import { ArrowLeft, Loader2, FileEdit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { KIND_BLOG_POST } from '@/hooks/useBlogs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormValues {
  title: string;
  summary: string;
  topics: string;
  content: string;
}

export function PublishBlogPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { toast } = useToast();
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { content: '' },
  });

  const title = watch('title', '');
  const content = watch('content', '');

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const d = slugify(values.title) || `blog-${Date.now()}`;
      const now = Math.floor(Date.now() / 1000);

      const tags: string[][] = [
        ['d', d],
        ['title', values.title.trim()],
        ['published_at', String(now)],
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

      const event = await publishEvent({
        kind: KIND_BLOG_POST,
        content: values.content.trim(),
        tags,
      });

      const naddr = nip19.naddrEncode({
        kind: KIND_BLOG_POST,
        pubkey: event.pubkey,
        identifier: d,
      });

      toast({ title: 'Blog post published!', description: values.title });
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
        <FileEdit className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Log in to publish</h2>
          <p className="text-muted-foreground text-sm mb-4">
            You need a Nostr account to publish a blog post.
          </p>
        </div>
        <LoginArea className="max-w-60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/publish">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Blog Post</h1>
            <p className="text-sm text-muted-foreground">Write a long-form article on Nostr (NIP-23)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Hero image — full width, uploads to Blossom */}
          <HeroImageUploader value={coverImage} onChange={setCoverImage} />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Your blog post title"
              className="text-lg font-medium"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
            {title && (
              <p className="text-xs text-muted-foreground">
                Slug: <code className="bg-muted px-1 rounded">{slugify(title) || '—'}</code>
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary / Subtitle</Label>
            <Textarea
              id="summary"
              placeholder="A short description of this post (shown in previews)"
              rows={2}
              {...register('summary')}
            />
          </div>

          {/* Topics */}
          <div className="space-y-2">
            <Label htmlFor="topics">Tags (comma-separated)</Label>
            <Input
              id="topics"
              placeholder="bitcoin, nostr, tech"
              {...register('topics')}
            />
          </div>

          {/* Content editor with preview */}
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
                  placeholder={`# Your heading\n\nWrite your blog post in Markdown...\n\n## Section\n\nParagraphs, **bold**, _italic_, [links](https://nostr.com), and more.`}
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
                    <p className="text-muted-foreground text-sm italic">
                      Nothing to preview yet — switch to Write and add some content.
                    </p>
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
                Publishing…
              </>
            ) : (
              <>
                <FileEdit className="w-4 h-4 mr-2" />
                Publish Blog Post
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
