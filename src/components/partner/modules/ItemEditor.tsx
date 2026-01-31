'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ModuleItem, ModuleSchema, PartnerModule } from '@/lib/modules/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SUPPORTED_CURRENCIES } from '@/lib/modules/constants';

interface ItemEditorProps {
    initialItem?: Partial<ModuleItem>;
    module: PartnerModule;
    schema: ModuleSchema;
    onSave: (item: Partial<ModuleItem>) => Promise<void>;
    onCancel: () => void;
}

export function ItemEditor({ initialItem, module, schema, onSave, onCancel }: ItemEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    // Combine all fields (schema fields + custom fields)
    // Note: PartnerModule in types has customFields array. 
    // We should ideally merge schema.fields and module.customFields for the full list.
    const allFields = [...schema.fields, ...module.customFields].sort((a, b) => a.order - b.order);

    const defaultValues = {
        name: '',
        description: '',
        category: module.settings.defaultCategory || 'General',
        isActive: true,
        isFeatured: false,
        price: 0,
        currency: module.settings.defaultCurrency || 'INR',
        fields: {},
        images: [],
        ...initialItem,
    };

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues
    });

    const watchedFields = watch();

    const handleFormSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            await onSave(data);
        } catch (error) {
            toast.error('Failed to save item');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to render dynamic input based on field type
    const renderFieldInput = (field: any) => {
        const fieldId = `fields.${field.id}`;
        const value = watchedFields.fields?.[field.id];

        switch (field.type) {
            case 'textarea':
                return <Textarea {...register(fieldId)} placeholder={field.placeholder} rows={3} />;

            case 'number':
            case 'currency':
                return <Input type="number" step="0.01" {...register(fieldId)} placeholder={field.placeholder} />;

            case 'toggle':
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={!!value}
                            onCheckedChange={(checked) => setValue(fieldId, checked)}
                        />
                        <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                    </div>
                );

            case 'select':
                return (
                    <Select
                        value={value || ''}
                        onValueChange={(val) => setValue(fieldId, val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Select option"} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'date':
                return <Input type="date" {...register(fieldId)} />;

            case 'time':
                return <Input type="time" {...register(fieldId)} />;

            default:
                return <Input type="text" {...register(fieldId)} placeholder={field.placeholder} />;
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{initialItem?.id ? 'Edit Item' : 'New Item'}</h2>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Item
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                <Input id="name" {...register('name', { required: true })} />
                                {errors.name && <span className="text-xs text-red-500">Required</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" {...register('description')} rows={3} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={watchedFields.category}
                                        onValueChange={(val) => setValue('category', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schema.categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                            <SelectItem value="General">General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={watchedFields.currency}
                                            onValueChange={(val) => setValue('currency', val)}
                                        >
                                            <SelectTrigger className="w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SUPPORTED_CURRENCIES.map(c => (
                                                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            id="price"
                                            step="0.01"
                                            {...register('price', { valueAsNumber: true })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {allFields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            {field.name}
                                            {field.isRequired && <span className="text-red-500">*</span>}
                                        </Label>
                                        {renderFieldInput(field)}
                                        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                                    </div>
                                ))}
                                {allFields.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-muted-foreground">
                                        No custom fields defined for this module.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                                <p className="text-muted-foreground">Image upload component placeholder</p>
                                <p className="text-xs text-muted-foreground mt-2">Drag and drop images here</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Active Status</Label>
                                    <p className="text-sm text-muted-foreground">Visible to customers and staff</p>
                                </div>
                                <Switch
                                    checked={watchedFields.isActive}
                                    onCheckedChange={(c) => setValue('isActive', c)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Featured Item</Label>
                                    <p className="text-sm text-muted-foreground">Highlight this item in lists</p>
                                </div>
                                <Switch
                                    checked={watchedFields.isFeatured}
                                    onCheckedChange={(c) => setValue('isFeatured', c)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </form>
    );
}
