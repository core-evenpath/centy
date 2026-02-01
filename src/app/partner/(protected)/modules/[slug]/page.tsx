'use client';

import { useState } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { usePartnerModule, useModuleItems } from '@/hooks/use-modules';
import { ItemsList } from '@/components/partner/modules/ItemsList';
import { ItemEditor } from '@/components/partner/modules/ItemEditor';
import { ModuleItem } from '@/lib/modules/types';
import {
    createModuleItemAction,
    updateModuleItemAction,
    reorderItemsAction
} from '@/actions/modules-actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, Package } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface PageProps {
    params: {
        slug: string;
    };
}

export default function ModuleManagePage({ params }: PageProps) {
    const { user, currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;

    const { partnerModule, systemModule, isLoading: pLoading, refetch: refetchModule } = usePartnerModule(
        partnerId || '',
        params.slug
    );

    const { items, isLoading: iLoading, refetch } = useModuleItems(
        partnerId || '',
        partnerModule?.id || '',
        { pageSize: 100 }
    );

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ModuleItem> | undefined>(undefined);

    const isLoading = authLoading || pLoading || (partnerModule && iLoading);

    if (authLoading) {
        return (
            <div className="container mx-auto py-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    if (!partnerId) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Please sign in to view modules.</p>
                </div>
            </div>
        );
    }

    if (isLoading && !partnerModule) {
        return (
            <div className="container mx-auto py-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    if (!partnerModule || !systemModule) {
        return (
            <div className="container mx-auto py-8">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/partner/modules">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Modules
                    </Link>
                </Button>
                <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-medium">Module not found</h2>
                    <p className="text-muted-foreground mt-1">
                        This module may not be enabled for your account.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/partner/modules">Browse Available Modules</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const schema = systemModule.schema;
    const itemLabel = systemModule.itemLabel || 'Item';
    const itemLabelPlural = systemModule.itemLabelPlural || 'Items';

    const handleCreate = () => {
        setEditingItem(undefined);
        setIsEditorOpen(true);
    };

    const handleEdit = (item: ModuleItem) => {
        setEditingItem(item);
        setIsEditorOpen(true);
    };

    const handleSave = async (data: Partial<ModuleItem>) => {
        if (!partnerId) return;

        try {
            if (editingItem?.id) {
                const result = await updateModuleItemAction(
                    partnerId,
                    partnerModule.id,
                    editingItem.id,
                    data,
                    user?.uid || 'unknown'
                );
                if (result.success) {
                    toast.success(`${itemLabel} updated`);
                    refetch();
                    setIsEditorOpen(false);
                } else {
                    toast.error(result.error || 'Failed to update');
                }
            } else {
                const result = await createModuleItemAction(
                    partnerId,
                    partnerModule.id,
                    data as any,
                    user?.uid || 'unknown'
                );
                if (result.success) {
                    toast.success(`${itemLabel} created`);
                    refetch();
                    refetchModule();
                    setIsEditorOpen(false);
                } else {
                    toast.error(result.error || 'Failed to create');
                }
            }
        } catch (e) {
            toast.error('Operation failed');
            console.error(e);
        }
    };

    const handleReorder = async (newItems: ModuleItem[]) => {
        if (!partnerId) return;
        const itemIds = newItems.map(i => i.id);
        await reorderItemsAction(partnerId, partnerModule.id, itemIds);
        refetch();
    };

    const handleToggleStatus = async (item: ModuleItem) => {
        if (!partnerId) return;
        await updateModuleItemAction(
            partnerId,
            partnerModule.id,
            item.id,
            { isActive: !item.isActive },
            user?.uid || 'unknown'
        );
        refetch();
        toast.success(`${itemLabel} ${item.isActive ? 'deactivated' : 'activated'}`);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/partner/modules">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Modules
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{partnerModule.name}</h1>
                        <p className="text-muted-foreground mt-2">
                            {items.length} {items.length === 1 ? itemLabel.toLowerCase() : itemLabelPlural.toLowerCase()} •{' '}
                            {schema.categories.length} categories
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add {itemLabel}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <ItemEditor
                                    initialItem={editingItem}
                                    module={partnerModule}
                                    schema={schema}
                                    onSave={handleSave}
                                    onCancel={() => setIsEditorOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-medium text-slate-900 mb-1">No {itemLabelPlural.toLowerCase()} yet</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Add your first {itemLabel.toLowerCase()} to get started
                    </p>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add {itemLabel}
                    </Button>
                </div>
            ) : (
                <ItemsList
                    items={items}
                    module={partnerModule}
                    schema={schema}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onReorder={handleReorder}
                />
            )}
        </div>
    );
}
