
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartnerModule } from '@/lib/modules/types';
import { executeModuleMigrationAction } from '@/actions/modules-actions';
import { toast } from 'sonner';
import { MigrationPreview } from './MigrationPreview';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    module: PartnerModule;
    partnerId: string;
}

export function UpgradeDialog({ open, onOpenChange, module, partnerId }: UpgradeDialogProps) {
    const [isUpgrading, setIsUpgrading] = useState(false);
    const router = useRouter();

    const handleUpgrade = async () => {
        setIsUpgrading(true);
        try {
            const result = await executeModuleMigrationAction(partnerId, module.id, module.latestVersion);

            if (result.success) {
                toast.success('Module upgraded successfully', {
                    description: `Migrated ${result.data?.itemsMigrated} items to v${result.data?.toVersion}`
                });
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error('Upgrade failed', {
                    description: result.error
                });
            }
        } catch (error) {
            toast.error('An unexpected error occurred during upgrade');
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Available</DialogTitle>
                    <DialogDescription>
                        A new version (v{module.latestVersion}) of {module.name} is available.
                        Review the changes below before upgrading.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <MigrationPreview
                        partnerId={partnerId}
                        moduleId={module.id}
                        targetVersion={module.latestVersion}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpgrading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpgrade} disabled={isUpgrading}>
                        {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUpgrading ? 'Upgrading...' : 'Confirm Upgrade'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
