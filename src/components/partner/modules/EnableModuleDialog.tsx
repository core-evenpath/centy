'use client';

import { useState } from 'react';
import { SystemModule } from '@/lib/modules/types';
import { enablePartnerModuleAction } from '@/actions/modules-actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleCard } from './ModuleCard';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface EnableModuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableModules: SystemModule[];
    partnerId: string;
    onEnable: () => void;
}

export function EnableModuleDialog({ open, onOpenChange, availableModules, partnerId, onEnable }: EnableModuleDialogProps) {
    const [selectedModule, setSelectedModule] = useState<SystemModule | null>(null);
    const [customName, setCustomName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleEnable = async () => {
        if (!selectedModule) return;

        setIsSubmitting(true);
        try {
            const result = await enablePartnerModuleAction(
                partnerId,
                selectedModule.slug,
                customName || selectedModule.name
            );

            if (result.success) {
                toast.success(`${selectedModule.name} enabled successfully`);
                onEnable();
                onOpenChange(false);
                router.push(`/partner/modules/${selectedModule.slug}`);
            } else {
                toast.error(result.error || 'Failed to enable module');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelect = (module: SystemModule) => {
        setSelectedModule(module);
        setCustomName(module.name);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Enable Module</DialogTitle>
                    <DialogDescription>
                        Select a module to add to your business tools.
                    </DialogDescription>
                </DialogHeader>

                {!selectedModule ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
                        {availableModules.map(module => (
                            <ModuleCard
                                key={module.id}
                                module={module}
                                variant="available"
                                onClick={() => handleSelect(module)}
                            />
                        ))}
                        {availableModules.length === 0 && (
                            <div className="col-span-full py-8 text-center text-muted-foreground">
                                No new modules available to enable.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="bg-muted/30 p-4 rounded-lg border">
                            <div className="font-semibold text-lg mb-2">Selected: {selectedModule.name}</div>
                            <p className="text-sm text-muted-foreground">{selectedModule.description}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-name">Display Name</Label>
                            <Input
                                id="custom-name"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                placeholder={selectedModule.name}
                            />
                            <p className="text-xs text-muted-foreground">
                                You can rename this module to fit your business terminology (e.g., "Food Menu" &rarr; "Our Menu")
                            </p>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setSelectedModule(null)}>Back to Selection</Button>
                            <Button onClick={handleEnable} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enable Module
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
