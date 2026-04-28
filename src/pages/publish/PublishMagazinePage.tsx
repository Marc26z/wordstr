import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePublishMagazine } from '@/hooks/usePublishMagazine';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { LoginArea } from '@/components/auth/LoginArea';
import { KIND_MAGAZINE, slugify } from '@/lib/pressstr';
import { ArrowLeft, Loader2, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

interface FormValues {
  title: string;
  summary: string;
  topics: string;
  language: string;
  url: string;
  content: string;
}

export function PublishMagazinePage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { publishMagazine } = usePublishMagazine();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { language: 'en' },
  });

  const title = watch('title', '');

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const d = slugify(values.title) || `magazine-${Date.now()}`;
      const event = await publishMagazine({
        d,
        title: values.title.trim(),
        image: logoUrl || undefined,
        summary: values.summary.trim() || undefined,
        topics: values.topics
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        language: values.language.trim() || undefined,
        url: values.url.trim() || undefined,
        content: values.content.trim(),
      });

      const naddr = nip19.naddrEncode({
        kind: KIND_MAGAZINE,
        pubkey: event.pubkey,
        identifier: d,
      });

      toast({ title: 'Magazine created!', description: values.title });
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
        <Newspaper className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Log in to publish</h2>
          <p className="text-muted-foreground text-sm mb-4">
            You need a Nostr account to publish a magazine.
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
            <h1 className="text-2xl font-bold">New Magazine</h1>
            <p className="text-sm text-muted-foreground">Create a magazine publication on Nostr</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CoverImagePicker
            value={logoUrl}
            onChange={setLogoUrl}
            label="Magazine Logo / Masthead"
            aspectRatio="3/2"
          />

          <div className="space-y-2">
            <Label htmlFor="title">Magazine Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Bitcoin Magazine"
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

          <div className="space-y-2">
            <Label htmlFor="summary">Short Description</Label>
            <Textarea
              id="summary"
              placeholder="What is this magazine about?"
              rows={2}
              {...register('summary')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Full Description (Markdown)</Label>
            <Textarea
              id="content"
              placeholder="Extended description, mission statement, etc."
              rows={4}
              {...register('content')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topics">Topics (comma-separated)</Label>
              <Input
                id="topics"
                placeholder="bitcoin, tech, culture"
                {...register('topics')}
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

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://yourmagazine.com"
              {...register('url')}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Newspaper className="w-4 h-4 mr-2" />
                Publish Magazine
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
