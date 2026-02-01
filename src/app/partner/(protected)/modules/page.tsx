'use client';

import { useState } from 'react';
import { ModulesDashboard } from '@/components/partner/modules/ModulesDashboard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { resetPartnerModulesAction } from '@/actions/modules-actions';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function PartnerModulesPage() {
    const { user, currentWorkspace } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!partnerId) return;

        setIsResetting(true);
        try {
            const result = await resetPartnerModulesAction(partnerId);
            if (result.success) {
                toast.success(`Reset complete. Removed ${result.data?.deleted} modules.`);
                setIsResetOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to reset modules');
            }
        } catch (error) {
            console.error('Reset failed:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Business Modules</h1>
                    <p className="text-muted-foreground">
                        Tools and managers tailored for your specific business needs.
                    </p>
                </div>

                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="text-muted-foreground hover:text-destructive">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Modules
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Reset All Modules?
                            </DialogTitle>
                            <DialogDescription className="pt-2 space-y-3" asChild>
                                <div>
                                    <p>This will <strong>delete all enabled modules</strong> and their data (items, categories, configuration) for this account.</p>
                                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium">
                                        This action cannot be undone. You will need to re-activate modules manually.
                                    </div>
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                            <Button variant="ghost" onClick={() => setIsResetOpen(false)} disabled={isResetting}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                                {isResetting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Yes, Reset Everything'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Separator className="mb-8" />
            <ModulesDashboard />
        </div>
    );
}
