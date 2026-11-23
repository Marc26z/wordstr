import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroImageUploader } from '@/components/HeroImageUploader';
import { slugify } from '@/lib/pressstr';
import { FileEdit, Eye, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { NostrEvent } from '@nostrify/nostrify';

export interface BlogFormValues {
  title: string;
  summary: string;
  topics: string;
  content: string;
  promoVideo: string;
  priceSats: string;
}

export interface BlogDraftInput {
  title: string;
  summary: string;
  topics: string;
  content: string;
  coverImage: string;
  promoVideo: string;
  priceSats: string;
}

interface BlogPostEditorProps {
  /** Existing event when editing; undefined when creating a new post. */
  event?: NostrEvent;
  /** Existing d-tag identifier when editing; undefined when creating. */
  identifier?: string;
  /** Existing sale price in satoshis when editing an already-paid post. */
  salePriceSats?: string;
  /** Initial values used when the form first mounts (e.g. from a draft). */
  initialValues?: Partial<BlogFormValues> & { coverImage?: string };
  /** Whether to reset the form from the provided `event` when it loads. Defaults to true. */
  prefillFromEvent?: boolean;
  /** Whether a save/publish operation is in progress. */
  isSubmitting: boolean;
  /** Label for the primary submit button. */
  submitLabel: string;
  /** Callback when the form is submitted. Receives values + derived d tag + cover image. */
  onSubmit: (values: BlogFormValues, dTag: string, coverImage: string) => void | Promise<void>;
  /** Optional callback invoked whenever the form values change (debounced). */
  onAutoSave?: (values: BlogDraftInput) => void;
  /** Optional callback invoked immediately when the user clicks a manual Save Draft button. */
  onManualSave?: (values: BlogDraftInput) => void;
}

function getTag(event: NostrEvent | undefined, name: string): string {
  return event?.tags.find(([n]) => n === name)?.[1] ?? '';
}

function hasDraftableContent(values: BlogDraftInput): boolean {
  return Boolean(
    values.title.trim() || values.content.trim() || values.summary.trim() || values.coverImage,
  );
}

/**
 * Shared NIP-23 blog post editor form.
 *
 * Handles the Markdown editor, preview, hero image, auto-save, and manual
 * draft saving so both PublishBlogPage and EditBlogPage stay consistent.
 */
export function BlogPostEditor({
  event,
  identifier,
  salePriceSats,
  initialValues,
  prefillFromEvent = true,
  isSubmitting,
  submitLabel,
  onSubmit,
  onAutoSave,
  onManualSave,
}: BlogPostEditorProps) {
  const [coverImage, setCoverImage] = useState(initialValues?.coverImage ?? '');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BlogFormValues>({
    defaultValues: {
      title: initialValues?.title ?? '',
      summary: initialValues?.summary ?? '',
      topics: initialValues?.topics ?? '',
      content: initialValues?.content ?? '',
      promoVideo: initialValues?.promoVideo ?? '',
      priceSats: salePriceSats ?? initialValues?.priceSats ?? '',
    },
  });

  const title = watch('title', '');
  const summary = watch('summary', '');
  const topics = watch('topics', '');
  const content = watch('content', '');
  const promoVideo = watch('promoVideo', '');
  const watchPriceSats = watch('priceSats', '');

  // Keep cover image in sync if initialValues changes (e.g. draft load).
  useEffect(() => {
    if (initialValues?.coverImage !== undefined) {
      setCoverImage(initialValues.coverImage);
    }
  }, [initialValues?.coverImage]);

  // Pre-fill form when editing an existing event (unless a draft is being restored).
  useEffect(() => {
    if (event && prefillFromEvent) {
      reset({
        title: getTag(event, 'title'),
        summary: getTag(event, 'summary'),
        topics: event.tags
          .filter(([n]) => n === 't')
          .map(([, v]) => v)
          .join(', '),
        content: event.content,
        promoVideo: getTag(event, 'video'),
        priceSats: salePriceSats ?? '',
      });
      setCoverImage(getTag(event, 'image'));
    }
  }, [event, prefillFromEvent, reset, salePriceSats]);

  // Debounced auto-save.
  useEffect(() => {
    if (!onAutoSave) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    const draft: BlogDraftInput = {
      title,
      summary,
      topics,
      content,
      coverImage,
      promoVideo,
      priceSats: watchPriceSats,
    };

    if (!hasDraftableContent(draft)) return;

    autoSaveTimeoutRef.current = setTimeout(() => {
      onAutoSave(draft);
      setAutoSavedAt(Date.now());
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, summary, topics, content, coverImage, promoVideo, watchPriceSats, onAutoSave]);

  const handleFormSubmit = (values: BlogFormValues) => {
    const dTag = identifier ?? (slugify(values.title) || `blog-${Date.now()}`);
    onSubmit(values, dTag, coverImage);
  };

  const handleManualSave = () => {
    onManualSave?.({
      title,
      summary,
      topics,
      content,
      coverImage,
      promoVideo,
      priceSats: watchPriceSats,
    });
    setAutoSavedAt(Date.now());
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <HeroImageUploader value={coverImage} onChange={setCoverImage} />

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
        {title && !identifier && (
          <p className="text-xs text-muted-foreground">
            URL: <code className="bg-muted px-1 rounded">/blog/npub1…/{slugify(title) || '—'}</code>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary / Subtitle</Label>
        <Textarea
          id="summary"
          placeholder="A short description of this post (shown in previews)"
          rows={2}
          {...register('summary')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="topics">Tags (comma-separated)</Label>
        <Input
          id="topics"
          placeholder="bitcoin, nostr, tech"
          {...register('topics')}
        />
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
          Leave empty or 0 to publish for free. A paid post gets a NIP-99 listing; visitors pay with Lightning without logging in.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="promoVideo">
          Promo Video
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Paste a Divine video link (e.g. https://divine.video/video/…)
          </span>
        </Label>
        <Input
          id="promoVideo"
          type="url"
          placeholder="https://divine.video/video/abc123…"
          {...register('promoVideo')}
        />
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

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {submitLabel}…
            </>
          ) : (
            <>
              <FileEdit className="w-4 h-4 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>

        {onManualSave && (
          <Button
            type="button"
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30"
            onClick={handleManualSave}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Save draft
          </Button>
        )}
      </div>

      {autoSavedAt && (
        <p className="text-xs text-muted-foreground text-center">
          Auto-saved at {new Date(autoSavedAt).toLocaleTimeString()}
        </p>
      )}
    </form>
  );
}
