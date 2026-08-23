import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { LoginArea } from '@/components/auth/LoginArea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { blogPostUrl } from '@/lib/blogUrl';
import { ArrowLeft, FileEdit } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { KIND_BLOG_POST } from '@/hooks/useBlogs';
import { useBlogDrafts } from '@/hooks/useBlogDrafts';
import { BlogPostEditor, type BlogDraftInput, type BlogFormValues } from '@/components/BlogPostEditor';

export function PublishBlogPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft') ?? undefined;
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { toast } = useToast();
  const { get, save, remove } = useBlogDrafts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const draft = draftId ? get(draftId) : undefined;

  // Notify when a requested draft cannot be found.
  useEffect(() => {
    if (draftId && draft === undefined) {
      toast({
        title: 'Draft not found',
        description: 'The requested draft could not be loaded.',
        variant: 'destructive',
      });
    }
  }, [draftId, draft, toast]);

  const initialValues = draft
    ? {
        title: draft.title,
        summary: draft.summary,
        topics: draft.topics,
        content: draft.content,
        coverImage: draft.coverImage,
      }
    : undefined;

  const handlePublish = async (values: BlogFormValues, dTag: string, coverImage: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const now = Math.floor(Date.now() / 1000);

      const tags: string[][] = [
        ['d', dTag],
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

      // Remove any associated draft after successful publish.
      if (draftId) {
        remove(draftId);
      }

      toast({ title: 'Blog post published!', description: values.title });
      navigate(blogPostUrl(event.pubkey, dTag));
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

  const handleAutoSave = (input: BlogDraftInput) => {
    if (!user) return;
    const saved = save({
      id: draftId,
      ...input,
    });
    // Update the URL with the new draft id so a refresh doesn't lose it.
    if (saved && saved.id !== draftId) {
      navigate(`/publish/blog?draft=${saved.id}`, { replace: true });
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{draft ? 'Continue draft' : 'New Blog Post'}</h1>
            <p className="text-sm text-muted-foreground">
              {draft ? 'Your changes are saved automatically.' : 'Write a long-form article on Nostr (NIP-23)'}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <BlogPostEditor
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          submitLabel="Publish Blog Post"
          onSubmit={handlePublish}
          onAutoSave={handleAutoSave}
          onManualSave={handleAutoSave}
        />
      </div>
    </div>
  );
}
