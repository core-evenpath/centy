'use client';

import { useState } from 'react';

import { useSystemModules } from '@/hooks/use-modules';
import { ModuleCard } from './ModuleCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkGenerationDialog } from './BulkGenerationDialog';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { Sparkles, Package, LayoutGrid, Trash2 } from 'lucide-react';

export function ModulesList() {
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const { modules, isLoading, error, refetch } = useSystemModules();

    const handleBulkComplete = () => {
        refetch();
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[200px] w-full items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
                <p>Error loading modules: {error}</p>
            </div>
        );
    }

    if (modules.length === 0) {
        return (
            <div className="space-y-6">
                <div className="relative rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12">
                    <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,transparent)]" />

                    <div className="relative flex flex-col items-center text-center">
                        <div className="mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-4">
                            <Package className="h-8 w-8 text-blue-600" />
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900">No modules found</h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-md">
                            Get started by creating your first module, or let AI generate a comprehensive set for all industries.
                        </p>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <Button variant="outline" asChild>
                                <Link href="/admin/modules/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Module
                                </Link>
                            </Button>

                            <Button onClick={() => setBulkDialogOpen(true)}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate All with AI
                            </Button>
                        </div>


                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400">
                            <span>🏨 Hospitality</span>
                            <span>🍽️ Food & Bev</span>
                            <span>💼 Professional</span>
                            <span>🏥 Healthcare</span>
                            <span>💆 Wellness</span>
                            <span>🛒 Retail</span>
                            <span>🎓 Education</span>
                            <span>🏠 Real Estate</span>
                        </div>
                    </div >
                </div >

                <BulkGenerationDialog
                    open={bulkDialogOpen}
                    onOpenChange={setBulkDialogOpen}
                    onComplete={handleBulkComplete}
                />
            </div >
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                </Button>
                <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Bulk Generate
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                ))}
            </div>

            <BulkGenerationDialog
                open={bulkDialogOpen}
                onOpenChange={setBulkDialogOpen}
                onComplete={handleBulkComplete}
            />


            <BulkDeleteDialog
                open={bulkDeleteDialogOpen}
                onOpenChange={setBulkDeleteDialogOpen}
                onComplete={handleBulkComplete}
            />
        </div>
    );
}
