'use client';

import { useState, useEffect, use } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { usePartnerModule, useModuleItems } from '@/hooks/use-modules';
import { ItemsList } from '@/components/partner/modules/ItemsList';
import { ItemEditor } from '@/components/partner/modules/ItemEditor';
import { ModuleItem } from '@/lib/modules/types';
import {
    createModuleItemAction,
    updateModuleItemAction,
    reorderItemsAction,
    deleteAllModuleItemsAction,
} from '@/actions/modules-actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, Package, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function ModuleManagePage({ params }: PageProps) {
    const { slug } = use(params);
    const { user, currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;

    const {
        partnerModule,
        systemModule,
        isLoading: pLoading,
        error: pError,
        refetch: refetchModule
    } = usePartnerModule(partnerId || '', slug);

    const moduleId = partnerModule?.id || '';
    const {
        items,
        isLoading: iLoading,
        error: iError,
        refetch
    } = useModuleItems(partnerId || '', moduleId, { pageSize: 100 });

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ModuleItem> | undefined>(undefined);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Combined loading state
    const isLoading = authLoading || pLoading || (partnerModule && iLoading);

    // Auth loading state
    if (authLoading) {
        return (
            <div className="container mx-auto py-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[200px] w-full" />
                <p className="text-sm text-muted-foreground">Loading authentication...</p>
            </div>
        );
    }

    // No partner ID
    if (!partnerId) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center py-12 border rounded-lg bg-yellow-50">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-lg font-medium">No Partner ID Found</h2>
                    <p className="text-muted-foreground mt-1">
                        Please sign in or select a workspace.
                    </p>
                    <pre className="mt-4 text-xs text-left bg-slate-100 p-4 rounded max-w-md mx-auto overflow-auto">
                        {JSON.stringify({
                            userId: user?.uid,
                            workspacePartnerId: currentWorkspace?.partnerId,
                            claimsPartnerId: user?.customClaims?.partnerId,
                        }, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    // Module loading
    if (isLoading && !partnerModule) {
        return (
            <div className="container mx-auto py-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[200px] w-full" />
                <p className="text-sm text-muted-foreground">
                    Loading module "{slug}" for partner {partnerId.slice(0, 8)}...
                </p>
            </div>
        );
    }

    // Module not found - with debug info
    if (!partnerModule || !systemModule) {
        return (
            <div className="container mx-auto py-8">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/partner/modules">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Modules
                    </Link>
                </Button>
                <div className="text-center py-12 border rounded-lg">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-medium">Module not found</h2>
                    <p className="text-muted-foreground mt-1">
                        Module "{slug}" is not enabled for this account.
                    </p>
                    {pError && (
                        <p className="text-red-500 text-sm mt-2">Error: {pError}</p>
                    )}
                    <pre className="mt-4 text-xs text-left bg-slate-100 p-4 rounded max-w-md mx-auto overflow-auto">
                        {JSON.stringify({
                            partnerId,
                            slug,
                            error: pError,
                        }, null, 2)}
                    </pre>
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

    const handleDeleteAll = async () => {
        if (!partnerId) return;

        setIsDeleting(true);
        try {
            const result = await deleteAllModuleItemsAction(partnerId, partnerModule.id);

            if (result.success) {
                toast.success(`Deleted ${result.data?.deleted || 0} ${itemLabelPlural.toLowerCase()}`);
                setIsDeleteAllOpen(false);
                refetch();
                refetchModule();
            } else {
                toast.error(result.error || 'Delete failed');
            }
        } catch (e) {
            toast.error('Delete failed');
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
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
                            {schema.categories?.length || 0} categories
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => refetch()}>
                                    Refresh Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAllOpen(true)}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete All Items
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add {itemLabel}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingItem ? 'Edit' : 'Add'} {itemLabel}
                                    </DialogTitle>
                                </DialogHeader>
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

            {iLoading && moduleId ? (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : items.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-medium text-slate-900 mb-1">No {itemLabelPlural.toLowerCase()} yet</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Add your first {itemLabel.toLowerCase()} to get started
                    </p>
                    {iError && (
                        <p className="text-red-500 text-sm mb-4">Error loading items: {iError}</p>
                    )}
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

            {/* Delete All Dialog */}
            <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete All {itemLabelPlural}
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-2" asChild>
                            <div>
                                <p>
                                    Are you sure you want to delete <strong>all {items.length} {itemLabelPlural.toLowerCase()}</strong>?
                                </p>
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                                    This action cannot be undone. All data will be permanently deleted.
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete All
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
