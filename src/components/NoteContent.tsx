import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Minimal note content renderer — renders plain text with linkified URLs. */
export function NoteContent({ event, className }: NoteContentProps) {
  const parts = parseContent(event.content);

  return (
    <span className={cn('whitespace-pre-wrap break-words', className)}>
      {parts.map((part, i) =>
        part.type === 'url' ? (
          <a
            key={i}
            href={part.text}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80 break-all"
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}

interface Part {
  type: 'text' | 'url';
  text: string;
}

const URL_RE = /https?:\/\/[^\s<>"']+/g;

function parseContent(content: string): Part[] {
  const parts: Part[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'url', text: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return parts;
}
