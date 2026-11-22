import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, BookOpen, FileText, ArrowLeft, FileEdit, FileStack } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';

export function PublishPage() {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Publish on wordstr</h2>
          <p className="text-muted-foreground mb-6">
            Log in to start publishing magazines, ebooks and blog posts on Nostr.
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
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Publish</h1>
            <p className="text-sm text-muted-foreground">Share your publications on Nostr</p>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Blog Post */}
          <Link to="/publish/blog">
            <Card className="group hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer border-2 hover:border-purple-500/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileEdit className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Blog Post</h2>
                  <p className="text-sm text-muted-foreground">
                    Write a long-form article in Markdown (NIP-23)
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Drafts */}
          <Link to="/drafts">
            <Card className="group hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer border-2 hover:border-purple-500/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileStack className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Drafts</h2>
                  <p className="text-sm text-muted-foreground">
                    Continue your saved blog post drafts
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Magazine */}
          <Link to="/publish/magazine">
            <Card className="group hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer border-2 hover:border-purple-500/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Newspaper className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">New Magazine</h2>
                  <p className="text-sm text-muted-foreground">
                    Create a magazine publication with recurring issues
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Issue */}
          <Link to="/publish/issue">
            <Card className="group hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer border-2 hover:border-purple-500/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">New Issue</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload a new issue to an existing magazine (PDF)
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Ebook */}
          <Link to="/publish/ebook">
            <Card className="group hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer border-2 hover:border-purple-500/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-7 h-7 text-fuchsia-600 dark:text-fuchsia-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">New Ebook</h2>
                  <p className="text-sm text-muted-foreground">
                    Publish a standalone ebook as PDF or EPUB
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
