'use client';

import { usePartnerModules, useAvailableModules } from '@/hooks/use-modules';
import { useAuth } from '@/hooks/use-auth';
import { ModuleCard } from './ModuleCard';
import { EnableModuleDialog } from './EnableModuleDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface ModulesDashboardProps {
    partnerId?: string;
}

export function ModulesDashboard({ partnerId: partnerIdProp }: ModulesDashboardProps) {
    const { user } = useAuth();
    const partnerId = partnerIdProp || user?.customClaims?.partnerId || '';
    const { modules: enabledModules, isLoading: enabledLoading, refetch } = usePartnerModules(partnerId);
    const { modules: availableModules, isLoading: availableLoading } = useAvailableModules(partnerId);
    const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);

    const isLoading = enabledLoading || availableLoading;

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    // Filter out modules that are already enabled
    const enabledSlugs = enabledModules.map(m => m.moduleSlug);
    const modulesToEnable = availableModules.filter(m => !enabledSlugs.includes(m.slug));

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Enabled Modules</h2>
                    {modulesToEnable.length > 0 && (
                        <Button onClick={() => setIsEnableDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Enable Module
                        </Button>
                    )}
                </div>

                {enabledModules.length === 0 ? (
                    <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-muted/10">
                        <p className="mb-4 text-lg">No modules enabled yet</p>
                        {modulesToEnable.length > 0 && (
                            <Button onClick={() => setIsEnableDialogOpen(true)}>
                                Enable Your First Module
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {enabledModules.map((module) => (
                            <ModuleCard key={module.id} module={module} variant="enabled" />
                        ))}
                    </div>
                )}
            </div>

            <EnableModuleDialog
                open={isEnableDialogOpen}
                onOpenChange={setIsEnableDialogOpen}
                availableModules={modulesToEnable}
                partnerId={partnerId}
                onEnable={refetch}
            />
        </div>
    );
}
