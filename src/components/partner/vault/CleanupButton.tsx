'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cleanupAllVaultData } from '@/actions/vault-actions';

interface CleanupButtonProps {
  partnerId: string;
  onCleanupComplete: () => void;
}

export default function CleanupButton({ partnerId, onCleanupComplete }: CleanupButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();

  const handleCleanup = async () => {
    if (confirmText !== 'DELETE ALL') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE ALL to confirm',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const result = await cleanupAllVaultData(partnerId);

      if (result.success) {
        toast({
          title: 'Cleanup complete',
          description: result.details
            ? `Deleted: ${result.details.firestoreFilesDeleted} files, ${result.details.geminiFilesDeleted} embeddings`
            : 'All vault data has been deleted',
        });
        setShowDialog(false);
        setConfirmText('');
        onCleanupComplete();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Cleanup failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Cleanup All
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete All Vault Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will permanently delete all vault data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>All uploaded documents</li>
                <li>All Gemini embeddings</li>
                <li>All query history</li>
                <li>All document tags</li>
              </ul>
              <p className="font-medium text-slate-700">
                This action cannot be undone.
              </p>
              <div className="pt-2">
                <p className="text-sm mb-2">Type <span className="font-mono font-bold">DELETE ALL</span> to confirm:</p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE ALL"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCleanup}
              disabled={isDeleting || confirmText !== 'DELETE ALL'}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Everything
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}