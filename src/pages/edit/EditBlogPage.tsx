import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { blogPostUrl } from '@/lib/blogUrl';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { KIND_BLOG_POST } from '@/hooks/useBlogs';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useBlogDrafts } from '@/hooks/useBlogDrafts';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BlogPostEditor, type BlogDraftInput, type BlogFormValues } from '@/components/BlogPostEditor';
import NotFound from '@/pages/NotFound';

export function EditBlogPage() {
  const { naddr } = useParams<{ naddr: string }>();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { toast } = useToast();
  const { drafts, save, removeByDTag } = useBlogDrafts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usePublishedVersion, setUsePublishedVersion] = useState(false);

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

  const draftForPost = useMemo(() => {
    if (!decoded) return undefined;
    return drafts.find((d) => d.dTag === decoded.identifier);
  }, [drafts, decoded]);

  const hasNewerDraft = Boolean(
    draftForPost && event && draftForPost.updatedAt > event.created_at * 1000,
  );
  const restoringDraft = hasNewerDraft && !usePublishedVersion;

  const draftInitialValues = draftForPost
    ? {
        title: draftForPost.title,
        summary: draftForPost.summary,
        topics: draftForPost.topics,
        content: draftForPost.content,
        coverImage: draftForPost.coverImage,
      }
    : undefined;

  const handleUpdate = async (values: BlogFormValues, dTag: string, coverImage: string) => {
    if (!user || !event || !decoded) return;
    setIsSubmitting(true);
    try {
      const tags: string[][] = [
        ['d', dTag],
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

      await publishEvent({
        kind: KIND_BLOG_POST,
        content: values.content.trim(),
        tags,
      });

      // Remove any draft tied to this post after a successful update.
      removeByDTag(dTag);

      toast({ title: 'Post updated!', description: values.title });
      navigate(blogPostUrl(decoded.pubkey, dTag));
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

  const handleAutoSave = (input: BlogDraftInput) => {
    if (!user || !decoded) return;
    save({
      id: draftForPost?.id,
      dTag: decoded.identifier,
      ...input,
    });
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
          <Link to={blogPostUrl(decoded.pubkey, decoded.identifier)}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Edit Blog Post</h1>
            <p className="text-sm text-muted-foreground">Update your long-form article on Nostr</p>
          </div>
          <ThemeToggle />
        </div>

        {hasNewerDraft && draftForPost && (
          <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm flex-1">
              <span className="font-medium">A newer local draft was found</span>{' '}
              <span className="text-muted-foreground">
                for this post (saved {new Date(draftForPost.updatedAt).toLocaleString()}).
              </span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-white dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/40"
              onClick={() => setUsePublishedVersion((v) => !v)}
            >
              {usePublishedVersion ? 'Restore draft' : 'Use published version'}
            </Button>
          </div>
        )}

        <BlogPostEditor
          key={restoringDraft ? 'draft' : 'published'}
          event={event}
          identifier={decoded.identifier}
          initialValues={restoringDraft ? draftInitialValues : undefined}
          prefillFromEvent={!restoringDraft}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
          onSubmit={handleUpdate}
          onAutoSave={handleAutoSave}
          onManualSave={handleAutoSave}
        />
      </div>
    </div>
  );
}

function getTag(event: NostrEvent | undefined, name: string): string {
  return event?.tags.find(([n]) => n === name)?.[1] ?? '';
}
