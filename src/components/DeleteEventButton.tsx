import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';

interface DeleteEventButtonProps {
  event: NostrEvent;
  /** Where to navigate after successful deletion (default: "/") */
  redirectTo?: string;
  /** Label shown inside the button (default: "Delete") */
  label?: string;
}

/**
 * Publishes a NIP-09 kind-5 deletion request for the given event, then
 * navigates away. Shows a confirmation AlertDialog first.
 */
export function DeleteEventButton({ event, redirectTo = '/', label = 'Delete' }: DeleteEventButtonProps) {
  const [open, setOpen] = useState(false);
  const { mutate: publish, isPending } = useNostrPublish();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = () => {
    publish(
      {
        kind: 5,
        content: '',
        tags: [
          ['e', event.id],
          ['a', `${event.kind}:${event.pubkey}:${event.tags.find(([n]) => n === 'd')?.[1] ?? ''}`],
          ['k', String(event.kind)],
        ],
      },
      {
        onSuccess: () => {
          toast({ title: 'Deletion request sent' });
          setOpen(false);
          navigate(redirectTo);
        },
        onError: (err) => {
          toast({
            title: 'Failed to delete',
            description: err.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {label}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this publication?</AlertDialogTitle>
            <AlertDialogDescription>
              This publishes a NIP-09 deletion request (kind 5). Relays and clients that
              honor deletion requests will remove this event, but deletion is not
              guaranteed across the entire network.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
