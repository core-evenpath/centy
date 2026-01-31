'use client';

import { useState } from 'react';
import { usePartnerModule, useModuleItems, useSystemModule } from '@/hooks/use-modules';
import { ItemsList } from '@/components/partner/modules/ItemsList';
import { ItemEditor } from '@/components/partner/modules/ItemEditor';
import { ModuleItem } from '@/lib/modules/types';
import {
    createModuleItemAction,
    updateModuleItemAction,
    reorderItemsAction
} from '@/actions/modules-actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface PageProps {
    params: {
        slug: string;
    };
}

const MOCK_PARTNER_ID = 'test-partner-id';

export default function ModuleManagePage({ params }: PageProps) {
    const { partnerModule, isLoading: pLoading } = usePartnerModule(MOCK_PARTNER_ID, params.slug);
    // Important: useModuleItems expects moduleId (UUID), not slug!
    // But we might only have slug initially. Wait, useModuleItems calls getModuleItemsAction which uses moduleId.
    // So we need partnerModule.id. 
    // If partnerModule is null, we can't fetch items yet.
    const { items, isLoading: iLoading, refetch } = useModuleItems(
        MOCK_PARTNER_ID,
        partnerModule?.id || '',
        { pageSize: 100 } // Fetch more items for this view
    );

    const { module: systemModule, isLoading: sLoading } = useSystemModule(partnerModule?.moduleSlug || '');

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ModuleItem> | undefined>(undefined);

    const isLoading = pLoading || (partnerModule && iLoading) || sLoading;

    if (isLoading && !partnerModule) {
        return (
            <div className="container mx-auto py-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    if (!partnerModule || !systemModule) {
        if (isLoading) return null; // Still loading subsequent data
        return <div className="container mx-auto py-8">Module not found</div>;
    }

    // Merge schemas if needed. For now using systemModule.schema
    const schema = systemModule.schema;

    const handleEdit = (item: ModuleItem) => {
        setEditingItem(item);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingItem(undefined);
        setIsEditorOpen(true);
    };

    const handleSave = async (data: Partial<ModuleItem>) => {
        try {
            if (editingItem?.id) {
                // Update
                const result = await updateModuleItemAction(MOCK_PARTNER_ID, partnerModule.id, editingItem.id, data, MOCK_PARTNER_ID);
                if (result.success) {
                    toast.success('Item updated');
                    refetch();
                    setIsEditorOpen(false);
                } else {
                    toast.error(result.error);
                }
            } else {
                // Create
                // Need to cast data to required type or handle missing fields
                const result = await createModuleItemAction(MOCK_PARTNER_ID, partnerModule.id, data as any, MOCK_PARTNER_ID);
                if (result.success) {
                    toast.success('Item created');
                    refetch();
                    setIsEditorOpen(false);
                } else {
                    toast.error(result.error);
                }
            }
        } catch (e) {
            toast.error('Operation failed');
        }
    };

    const handleReorder = async (newItems: ModuleItem[]) => {
        // Optimistic update locally? The list component handles display.
        // Call server action
        const itemIds = newItems.map(i => i.id);
        await reorderItemsAction(MOCK_PARTNER_ID, partnerModule.id, itemIds);
        refetch(); // Revalidate
    };

    const handleToggleStatus = async (item: ModuleItem) => {
        await updateModuleItemAction(MOCK_PARTNER_ID, partnerModule.id, item.id, { isActive: !item.isActive }, MOCK_PARTNER_ID);
        refetch();
        toast.success(`Item ${item.isActive ? 'deactivated' : 'activated'}`);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/partner/modules">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{partnerModule.name}</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your {partnerModule.name.toLowerCase()} items
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
                                    Add Item
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

            <ItemsList
                items={items}
                module={partnerModule}
                schema={schema}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onReorder={handleReorder}
            />
        </div>
    );
}
