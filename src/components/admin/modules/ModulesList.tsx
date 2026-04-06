'use client';

import { useState } from 'react';
import { useSystemModules } from '@/hooks/use-modules';
import { ModuleCard } from './ModuleCard';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Plus, Package, Trash2, RefreshCw, Brain, Wand2 } from 'lucide-react';
import { deriveModulesFromRegistryAction } from '@/actions/modules-actions';
import { toast } from 'sonner';

export function ModulesList() {
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [isDeriving, setIsDeriving] = useState(false);
    const { modules, isLoading, error, refetch } = useSystemModules();

    const handleDerive = async () => {
        setIsDeriving(true);
        try {
            const result = await deriveModulesFromRegistryAction();
            if (result.success) {
                if (result.created > 0) {
                    toast.success(`Created ${result.created} module(s), skipped ${result.skipped}`);
                    refetch();
                } else {
                    toast.info(`No new modules to create (${result.skipped} already exist)`);
                }
                if (result.errors.length > 0) {
                    toast.warning(`Errors: ${result.errors.join(', ')}`);
                }
            } else {
                toast.error(result.errors[0] || 'Derivation failed');
            }
        } catch {
            toast.error('Failed to derive modules from registry');
        } finally {
            setIsDeriving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-[200px] rounded-xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[200px] items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
                <p>Error: {error}</p>
                <Button variant="ghost" size="sm" onClick={refetch} className="ml-2">
                    <RefreshCw className="h-4 w-4 mr-1" /> Retry
                </Button>
            </div>
        );
    }

    if (modules.length === 0) {
        return (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white p-12">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Package className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">No modules yet</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-md">
                        Create modules for all your business industries with AI-powered generation.
                    </p>

                    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-start gap-3 max-w-lg text-left">
                        <Brain className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-indigo-700">
                            <p className="font-medium text-indigo-800">How this works:</p>
                            <p>Pick an industry, select sub-categories, and AI generates comprehensive fields, categories, and sample data for each module.</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button size="lg" asChild>
                            <Link href="/admin/modules/new">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Module
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-3 text-2xl">
                        {['🏨', '🍽️', '💼', '🏥', '💆', '🛒', '🎓', '🏠', '🏦', '🚗', '🌾', '🚚'].map((icon, i) => (
                            <div key={i} className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                                {icon}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-slate-500">{modules.length} modules</span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDerive}
                        disabled={isDeriving}
                    >
                        <Wand2 className={`h-4 w-4 mr-1 ${isDeriving ? 'animate-spin' : ''}`} />
                        {isDeriving ? 'Deriving...' : 'Derive from Blocks'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkDeleteDialogOpen(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 mr-1" /> Clear All
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {modules.map(module => (
                    <ModuleCard key={module.id} module={module} />
                ))}
            </div>

            <BulkDeleteDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen} onComplete={refetch} />
        </>
    );
}
