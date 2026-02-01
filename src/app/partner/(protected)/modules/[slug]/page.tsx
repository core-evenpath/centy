'use client';

import { useState, useRef } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { usePartnerModule, useModuleItems } from '@/hooks/use-modules';
import { ItemsList } from '@/components/partner/modules/ItemsList';
import { ItemEditor } from '@/components/partner/modules/ItemEditor';
import { ModuleItem } from '@/lib/modules/types';
import {
    createModuleItemAction,
    updateModuleItemAction,
    reorderItemsAction,
    bulkCreateModuleItemsAction,
    deleteAllModuleItemsAction,
} from '@/actions/modules-actions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, Package, Upload, Trash2, FileJson, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [bulkImportData, setBulkImportData] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    toast.error(result.error);
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
                    toast.error(result.error);
                }
            }
        } catch (e) {
            toast.error('Operation failed');
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setBulkImportData(content);
        };
        reader.readAsText(file);
    };

    const handleBulkImport = async () => {
        if (!partnerId || !bulkImportData.trim()) return;

        setIsImporting(true);
        try {
            let itemsToImport: any[];

            try {
                itemsToImport = JSON.parse(bulkImportData);
                if (!Array.isArray(itemsToImport)) {
                    itemsToImport = [itemsToImport];
                }
            } catch {
                toast.error('Invalid JSON format. Please check your data.');
                setIsImporting(false);
                return;
            }

            const result = await bulkCreateModuleItemsAction(
                partnerId,
                partnerModule.id,
                itemsToImport,
                user?.uid || 'unknown'
            );

            if (result.success) {
                toast.success(`Imported ${result.data?.created} ${itemLabelPlural.toLowerCase()}`);
                setBulkImportData('');
                setIsBulkImportOpen(false);
                refetch();
                refetchModule();
            } else {
                toast.error(result.error || 'Import failed');
            }
        } catch (e) {
            toast.error('Import failed');
            console.error(e);
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!partnerId) return;

        setIsDeleting(true);
        try {
            const result = await deleteAllModuleItemsAction(partnerId, partnerModule.id);

            if (result.success) {
                toast.success(`Deleted ${result.data?.deleted} ${itemLabelPlural.toLowerCase()}`);
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

    const sampleItem = {
        name: `Sample ${itemLabel}`,
        description: 'Description here',
        category: schema.categories[0]?.id || 'general',
        price: 1000,
        currency: 'INR',
        isActive: true,
        fields: schema.fields.slice(0, 3).reduce((acc: Record<string, any>, f) => {
            acc[f.id] = f.type === 'number' ? 0 : f.type === 'toggle' ? false : '';
            return acc;
        }, {} as Record<string, any>)
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsBulkImportOpen(true)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Bulk Import
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteAllOpen(true)}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete All Data
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
                    <div className="flex gap-2 justify-center">
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add {itemLabel}
                        </Button>
                        <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Bulk Import
                        </Button>
                    </div>
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

            {/* Bulk Import Dialog */}
            <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileJson className="h-5 w-5" />
                            Bulk Import {itemLabelPlural}
                        </DialogTitle>
                        <DialogDescription>
                            Import multiple {itemLabelPlural.toLowerCase()} from JSON data
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".json"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload JSON File
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or paste JSON</span>
                            </div>
                        </div>

                        <Textarea
                            placeholder={`[\n  ${JSON.stringify(sampleItem, null, 2).split('\n').join('\n  ')}\n]`}
                            value={bulkImportData}
                            onChange={(e) => setBulkImportData(e.target.value)}
                            className="font-mono text-xs min-h-[200px]"
                        />

                        <Alert>
                            <Sparkles className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Expected format:</strong> Array of {itemLabel.toLowerCase()} objects with name, description, category, price, and fields.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkImport} disabled={isImporting || !bulkImportData.trim()}>
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete All Dialog */}
            <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete All {itemLabelPlural}
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-2">
                            <span className="block">
                                Are you sure you want to delete <strong>all {items.length} {itemLabelPlural.toLowerCase()}</strong>?
                            </span>
                            <span className="block rounded-md bg-red-50 p-3 text-sm text-red-600">
                                This action cannot be undone. All {itemLabel.toLowerCase()} data will be permanently deleted.
                            </span>
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
