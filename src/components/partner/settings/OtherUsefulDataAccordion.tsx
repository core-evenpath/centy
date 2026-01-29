'use client';

import React, { useState, useTransition } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Save,
    X,
    Database,
    Globe,
    User,
    MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import type { OtherUsefulDataItem } from '@/lib/business-persona-types';
import {
    addOtherUsefulDataAction,
    deleteOtherUsefulDataAction,
    toggleOtherDataVisibilityAction
} from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OtherUsefulDataAccordionProps {
    partnerId: string;
    items: OtherUsefulDataItem[];
    className?: string;
}

export function OtherUsefulDataAccordion({ partnerId, items = [], className }: OtherUsefulDataAccordionProps) {
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleToggleVisibility = (itemId: string, currentStatus: boolean) => {
        startTransition(async () => {
            try {
                await toggleOtherDataVisibilityAction(partnerId, itemId, !currentStatus);
                toast.success(currentStatus ? 'Item hidden from Core' : 'Item visible to Core');
            } catch (error) {
                toast.error('Failed to update visibility');
            }
        });
    };

    const handleDelete = (itemId: string) => {
        if (!confirm('Are you sure you want to delete this data point?')) return;

        startTransition(async () => {
            try {
                await deleteOtherUsefulDataAction(partnerId, itemId);
                toast.success('Item deleted');
            } catch (error) {
                toast.error('Failed to delete item');
            }
        });
    };

    const handleAdd = () => {
        if (!newKey.trim() || !newValue.trim()) {
            toast.error('Please enter both a label and a value');
            return;
        }

        startTransition(async () => {
            try {
                await addOtherUsefulDataAction(partnerId, {
                    key: newKey,
                    value: newValue,
                    category: 'Manual',
                    source: 'manual',
                    visibleToCore: true
                });
                toast.success('Data point added');
                setNewKey('');
                setNewValue('');
                setIsAdding(false);
            } catch (error) {
                toast.error('Failed to add data point');
            }
        });
    };

    // Group items by category for better organization
    // const groupedItems = items.reduce(...); // Simpler flat list for now or just generic section

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-500" />
                    Other Useful Data ({items.length})
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdding(!isAdding)}
                    className="h-8 gap-1.5"
                >
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? 'Cancel' : 'Add Custom Data'}
                </Button>
            </div>

            {isAdding && (
                <div className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/50 space-y-3 mb-4 animate-in slide-in-from-top-2 fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Label / Key</label>
                            <Input
                                placeholder="e.g. WiFi Password, Parking Code"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Value / Description</label>
                            <Input
                                placeholder="Value..."
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-1">
                        <Button size="sm" onClick={handleAdd} disabled={isPending || !newKey || !newValue}>
                            <Save className="w-4 h-4 mr-1.5" />
                            Save Item
                        </Button>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                        No additional data found. Add custom notes or info for Core to remember.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative bg-white border rounded-lg p-3 transition-all",
                                item.visibleToCore ? "border-slate-200" : "border-slate-200 bg-slate-50/50 opacity-80"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-slate-900 truncate">
                                            {item.key}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-slate-100 text-slate-500 border-none font-normal">
                                            {item.source || 'Manual'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 break-words line-clamp-2">
                                        {typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1.5">
                                        Added {item.importedAt ? format(new Date(item.importedAt), 'MMM d, yyyy') : 'Unknown date'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8",
                                            item.visibleToCore ? "text-indigo-600 hover:text-indigo-700 bg-indigo-50" : "text-slate-400 hover:text-slate-600"
                                        )}
                                        onClick={() => handleToggleVisibility(item.id, item.visibleToCore)}
                                        title={item.visibleToCore ? "Visible to Core" : "Hidden from Core"}
                                        disabled={isPending}
                                    >
                                        {item.visibleToCore ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(item.id)}
                                        title="Delete item"
                                        disabled={isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
