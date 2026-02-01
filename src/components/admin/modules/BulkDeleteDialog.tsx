'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    const [forceDelete, setForceDelete] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const result = await bulkDeleteSystemModulesAction([], forceDelete);

            if (result.success) {
                const { deletedCount, skippedCount } = result.data || { deletedCount: 0, skippedCount: 0 };
                if (skippedCount > 0) {
                    toast.success(`Deleted ${deletedCount} modules, skipped ${skippedCount} in use`);
                } else {
                    toast.success(`Deleted ${deletedCount} modules successfully`);
                }
                onComplete();
                onOpenChange(false);
                setForceDelete(false);
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
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setForceDelete(false); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Delete All Modules
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                        <span className="block">
                            Are you sure you want to delete <strong>ALL system modules</strong>?
                        </span>
                        <span className="block rounded-md bg-red-50 p-3 text-sm text-red-600 flex gap-2">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <span>
                                This action cannot be undone. By default, modules in use by partners are skipped.
                            </span>
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                        id="force-delete"
                        checked={forceDelete}
                        onCheckedChange={(checked) => setForceDelete(checked === true)}
                    />
                    <Label htmlFor="force-delete" className="text-sm text-red-600 font-medium cursor-pointer">
                        Force delete (including modules in use) - DANGEROUS
                    </Label>
                </div>

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
