'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SystemModule } from '@/lib/modules/types';
import { createSystemModuleAction, updateSystemModuleAction } from '@/actions/modules-actions';
import { slugify } from '@/lib/modules/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { DEFAULT_MODULE_SETTINGS, PRICE_TYPE_LABELS, SUPPORTED_CURRENCIES } from '@/lib/modules/constants';

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9_]+$/, "Slug can only contain lowercase letters, numbers, and underscores"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    icon: z.string().min(1, "Icon is required"),
    itemLabel: z.string().min(1, "Item label is required"),
    itemLabelPlural: z.string().min(1, "Plural label is required"),
    priceLabel: z.string().min(1, "Price label is required"),
    priceType: z.enum(['one_time', 'per_night', 'per_hour', 'per_session', 'per_day', 'per_week', 'per_month', 'per_year', 'custom']),
    defaultCurrency: z.string(),
    status: z.enum(['active', 'draft', 'deprecated']),
    settings: z.object({
        requiresPrice: z.boolean(),
        requiresImage: z.boolean(),
        requiresCategory: z.boolean(),
        enableVariants: z.boolean(),
        enableInventoryTracking: z.boolean(),
        allowCustomFields: z.boolean(),
        maxItems: z.number().min(1),
    }),
});

interface ModuleEditorProps {
    module?: SystemModule;
}

export function ModuleEditor({ module }: ModuleEditorProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: module ? {
            name: module.name,
            slug: module.slug,
            description: module.description,
            icon: module.icon,
            itemLabel: module.itemLabel,
            itemLabelPlural: module.itemLabelPlural,
            priceLabel: module.priceLabel,
            priceType: module.priceType,
            defaultCurrency: module.defaultCurrency,
            status: module.status,
            settings: {
                requiresPrice: module.settings.requiresPrice,
                requiresImage: module.settings.requiresImage,
                requiresCategory: module.settings.requiresCategory,
                enableVariants: module.settings.enableVariants,
                enableInventoryTracking: module.settings.enableInventoryTracking,
                allowCustomFields: module.settings.allowCustomFields,
                maxItems: module.settings.maxItems,
            }
        } : {
            name: "",
            slug: "",
            description: "",
            icon: "📦",
            itemLabel: "Item",
            itemLabelPlural: "Items",
            priceLabel: "Price",
            priceType: "one_time",
            defaultCurrency: "INR",
            status: "draft",
            settings: {
                requiresPrice: true,
                requiresImage: false,
                requiresCategory: true,
                enableVariants: false,
                enableInventoryTracking: false,
                allowCustomFields: true,
                maxItems: 500,
            }
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        try {
            if (module) {
                const result = await updateSystemModuleAction(module.id, {
                    ...values,
                    settings: {
                        ...DEFAULT_MODULE_SETTINGS,
                        ...values.settings
                    }
                });
                if (result.success) {
                    toast.success('Module updated successfully');
                    router.refresh();
                } else {
                    toast.error(result.error || 'Failed to update module');
                }
            } else {
                const result = await createSystemModuleAction({
                    ...values,
                    settings: {
                        ...DEFAULT_MODULE_SETTINGS,
                        ...values.settings
                    },
                    color: 'blue', // Default color for new modules
                    applicableIndustries: [] as string[],
                    applicableFunctions: [] as string[],
                    schema: { fields: [], categories: [] }, // Empty schema for new modules
                    createdBy: 'admin', // Placeholder, should be handled by auth context or action
                });

                if (result.success && result.data) {
                    toast.success('Module created successfully');
                    router.push(`/admin/modules/${result.data.moduleId}/schema`);
                } else {
                    toast.error(result.error || 'Failed to create module');
                }
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!module && !form.getValues('slug')) {
            form.setValue('slug', slugify(e.target.value));
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Core details identifying the module
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Module Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Room Inventory" {...field} onBlur={(e) => {
                                                    field.onBlur();
                                                    handleNameBlur(e);
                                                }} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug (ID)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. room_inventory" disabled={!!module} {...field} />
                                            </FormControl>
                                            <FormDescription>Unique identifier used in code and URLs</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="What is this module for?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="icon"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Icon (Emoji)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="🛏️" className="text-2xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="deprecated">Deprecated</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Terminology & Pricing</CardTitle>
                            <CardDescription>
                                Customize how items are labeled and priced
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="itemLabel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Label (Singular)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Room" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="itemLabelPlural"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Label (Plural)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Rooms" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="priceLabel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price Label</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Rate / Fee / Price" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="priceType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select price type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(PRICE_TYPE_LABELS).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="defaultCurrency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Currency</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select currency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {SUPPORTED_CURRENCIES.map(curr => (
                                                        <SelectItem key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Settings</CardTitle>
                            <CardDescription>
                                Feature flags and constraints
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="space-y-3">
                                <FormField
                                    control={form.control}
                                    name="settings.requiresPrice"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Requires Price</FormLabel>
                                                <FormDescription>Items must have a price set</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="settings.requiresImage"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Requires Image</FormLabel>
                                                <FormDescription>Items must have at least one image</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="settings.enableVariants"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Enable Variants</FormLabel>
                                                <FormDescription>Allow multiple options (e.g. sizes/colors) per item</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="settings.enableInventoryTracking"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Inventory Tracking</FormLabel>
                                                <FormDescription>Track stock levels for items</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="settings.maxItems"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Items</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormDescription>Maximum items a partner can create</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {module ? 'Save Changes' : 'Create Module'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
