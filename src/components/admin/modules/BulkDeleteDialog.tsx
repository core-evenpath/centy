'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { bulkDeleteSystemModulesAction } from '@/actions/modules-actions';
import { toast } from 'sonner';

interface BulkDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function BulkDeleteDialog({ open, onOpenChange, onComplete }: BulkDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const result = await bulkDeleteSystemModulesAction([]); // Empty array = delete all

            if (result.success) {
                toast.success(`Deleted ${result.data?.deletedCount} modules successfully`);
                onComplete();
                onOpenChange(false);
            } else {
                toast.error(result.error || 'Failed to delete modules');
            }
        } catch (e) {
            toast.error('Bulk delete failed');
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Delete All Modules
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                        <p>
                            Are you sure you want to delete <strong>ALL system modules</strong>?
                        </p>
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 flex gap-2">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <span>
                                This action cannot be undone. Modules currently in use by partners will be skipped to prevent data corruption.
                            </span>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete All
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
