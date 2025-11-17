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
            ? `Deleted: ${result.details.firestoreFilesDeleted} files, ${result.details.geminiFilesDeleted} embeddings, ${result.details.queriesDeleted} queries`
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
        Cleanup All Data
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete All Vault Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all vault data including documents, embeddings, and query history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="font-semibold text-gray-900 mb-2">
                This will permanently delete:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>All uploaded documents</li>
                <li>All Gemini embeddings and RAG files</li>
                <li>All query history</li>
                <li>The file search store</li>
                <li>All training data</li>
              </ul>
              <div className="font-semibold text-red-600 mt-3">
                ⚠️ This action cannot be undone!
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">DELETE ALL</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE ALL"
                disabled={isDeleting}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleCleanup}
              disabled={confirmText !== 'DELETE ALL' || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete Everything'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}