import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginArea } from '@/components/auth/LoginArea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBlogDrafts, type BlogDraft } from '@/hooks/useBlogDrafts';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ArrowLeft, Clock, FileEdit, Plus, Trash2 } from 'lucide-react';

function formatDraftDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDraftTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function DraftCard({ draft, onDelete }: { draft: BlogDraft; onDelete: (id: string) => void }) {
  const title = draft.title.trim() || 'Untitled draft';
  const summary = draft.summary.trim();
  const excerpt = draft.content.trim();

  return (
    <Card className="group overflow-hidden hover:border-purple-400/60 transition-colors">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Cover thumbnail */}
          <Link
            to={`/publish/blog?draft=${draft.id}`}
            className="sm:w-44 h-32 sm:h-auto flex-shrink-0 block bg-muted/30"
          >
            {draft.coverImage ? (
              <img
                src={draft.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/30 to-purple-800/30">
                <FileEdit className="w-8 h-8 text-purple-500/50" />
              </div>
            )}
          </Link>

          {/* Body */}
          <div className="flex-1 p-4 min-w-0 flex flex-col">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-snug mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                {title}
              </h3>
              {summary ? (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{summary}</p>
              ) : excerpt ? (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{excerpt}</p>
              ) : null}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last edited {formatDraftDate(draft.updatedAt)} at {formatDraftTime(draft.updatedAt)}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Link to={`/publish/blog?draft=${draft.id}`} className="flex-1 sm:flex-initial">
                <Button
                  size="sm"
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Continue writing
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive gap-1.5"
                onClick={() => onDelete(draft.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DraftsLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-0 rounded-xl border overflow-hidden">
          <Skeleton className="sm:w-44 h-32 sm:h-auto" />
          <div className="flex-1 p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DraftsPage() {
  useSeoMeta({
    title: 'Drafts — WordStr',
    description: 'Your saved blog post drafts on WordStr.',
  });

  const { user } = useCurrentUser();
  const { drafts, remove, enabled } = useBlogDrafts();

  const isLoading = enabled && !drafts; // localStorage load is synchronous, but keep shape consistent

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/wordstr-logo.jpg"
              alt="WordStr"
              className="h-6 w-auto rounded"
            />
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-medium">Drafts</span>
          <div className="flex-1" />
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start sm:items-center justify-between gap-4 mb-8 flex-col sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold">Blog drafts</h1>
            <p className="text-sm text-muted-foreground">
              Saved locally in your browser, ready to publish when you are.
            </p>
          </div>
          {user && (
            <Link to="/publish/blog">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
                <Plus className="w-4 h-4" />
                New draft
              </Button>
            </Link>
          )}
        </div>

        {!user ? (
          <div className="border-2 border-dashed border-purple-200 dark:border-purple-900 rounded-2xl py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <FileEdit className="w-7 h-7 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Log in to view drafts</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Drafts are tied to your Nostr account and saved in this browser.
            </p>
            <LoginArea className="max-w-60 mx-auto" />
          </div>
        ) : isLoading ? (
          <DraftsLoading />
        ) : drafts.length > 0 ? (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft} onDelete={remove} />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-purple-200 dark:border-purple-900 rounded-2xl py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <FileEdit className="w-7 h-7 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No drafts yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Start a new blog post and your draft will be saved automatically as you write.
            </p>
            <Link to="/publish/blog">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Start Writing
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
