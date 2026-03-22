'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { PartnerCustomField, ModuleFieldType } from '@/lib/modules/types';
import { addPartnerCustomFieldAction, removePartnerCustomFieldAction } from '@/actions/modules-actions';
import { toast } from 'sonner';

interface CustomFieldManagerProps {
    partnerId: string;
    moduleId: string;
    customFields: PartnerCustomField[];
    onFieldsChange: (fields: PartnerCustomField[]) => void;
    maxCustomFields?: number;
}

const FIELD_TYPE_OPTIONS: { value: ModuleFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'currency', label: 'Currency' },
    { value: 'select', label: 'Dropdown' },
    { value: 'multi_select', label: 'Multi-Select' },
    { value: 'toggle', label: 'Toggle' },
    { value: 'tags', label: 'Tags' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
];

export function CustomFieldManager({
    partnerId,
    moduleId,
    customFields,
    onFieldsChange,
    maxCustomFields = 20,
}: CustomFieldManagerProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // New field form state
    const [fieldName, setFieldName] = useState('');
    const [fieldType, setFieldType] = useState<ModuleFieldType>('text');
    const [fieldRequired, setFieldRequired] = useState(false);
    const [fieldSearchable, setFieldSearchable] = useState(false);
    const [fieldOptions, setFieldOptions] = useState('');

    const resetForm = () => {
        setFieldName('');
        setFieldType('text');
        setFieldRequired(false);
        setFieldSearchable(false);
        setFieldOptions('');
    };

    const handleAdd = async () => {
        if (!fieldName.trim()) {
            toast.error('Field name is required');
            return;
        }

        const fieldId = `custom_${fieldName.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

        setIsAdding(true);
        try {
            const newField: Omit<PartnerCustomField, 'addedAt' | 'addedBy'> = {
                id: fieldId,
                name: fieldName.trim(),
                type: fieldType,
                isRequired: fieldRequired,
                isSearchable: fieldSearchable,
                showInList: false,
                showInCard: false,
                order: customFields.length,
                ...((['select', 'multi_select'].includes(fieldType) && fieldOptions)
                    ? { options: fieldOptions.split(',').map(o => o.trim()).filter(Boolean) }
                    : {}),
            };

            const result = await addPartnerCustomFieldAction(partnerId, moduleId, newField, partnerId);

            if (result.success) {
                onFieldsChange([...customFields, { ...newField, addedAt: new Date().toISOString(), addedBy: partnerId }]);
                resetForm();
                setDialogOpen(false);
                toast.success('Custom field added');
            } else {
                toast.error(result.error || 'Failed to add field');
            }
        } catch {
            toast.error('Failed to add field');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (fieldId: string) => {
        setRemovingId(fieldId);
        try {
            const result = await removePartnerCustomFieldAction(partnerId, moduleId, fieldId);
            if (result.success) {
                onFieldsChange(customFields.filter(f => f.id !== fieldId));
                toast.success('Custom field removed');
            } else {
                toast.error(result.error || 'Failed to remove field');
            }
        } catch {
            toast.error('Failed to remove field');
        } finally {
            setRemovingId(null);
        }
    };

    const showOptionsField = ['select', 'multi_select'].includes(fieldType);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium">Custom Fields</h3>
                    <p className="text-xs text-muted-foreground">
                        {customFields.length} of {maxCustomFields} custom fields
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={customFields.length >= maxCustomFields}
                        >
                            <Plus className="h-3 w-3 mr-1" /> Add Field
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Custom Field</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Field Name</Label>
                                <Input
                                    placeholder="e.g. Loyalty Points, Special Notes"
                                    value={fieldName}
                                    onChange={e => setFieldName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Field Type</Label>
                                <Select value={fieldType} onValueChange={v => setFieldType(v as ModuleFieldType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_TYPE_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {showOptionsField && (
                                <div className="space-y-2">
                                    <Label>Options (comma-separated)</Label>
                                    <Input
                                        placeholder="e.g. Option A, Option B, Option C"
                                        value={fieldOptions}
                                        onChange={e => setFieldOptions(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="required-toggle">Required</Label>
                                <Switch
                                    id="required-toggle"
                                    checked={fieldRequired}
                                    onCheckedChange={setFieldRequired}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="searchable-toggle">Searchable by AI</Label>
                                <Switch
                                    id="searchable-toggle"
                                    checked={fieldSearchable}
                                    onCheckedChange={setFieldSearchable}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => { resetForm(); setDialogOpen(false); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAdd} disabled={isAdding || !fieldName.trim()}>
                                {isAdding ? 'Adding...' : 'Add Field'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {customFields.length > 0 && (
                <div className="space-y-1.5">
                    {customFields.map(field => (
                        <div
                            key={field.id}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <GripVertical className="h-3 w-3 text-slate-300 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium">{field.name}</span>
                                <span className="text-xs text-slate-400 ml-2">{field.type}</span>
                                {field.isRequired && (
                                    <span className="text-xs text-red-400 ml-1">*</span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                onClick={() => handleRemove(field.id)}
                                disabled={removingId === field.id}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
