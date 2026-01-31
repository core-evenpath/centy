'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ModuleFieldDefinition } from '@/lib/modules/types';
import { generateFieldId, slugify } from '@/lib/modules/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X } from 'lucide-react';
import { FIELD_TYPE_LABELS } from '@/lib/modules/constants';
import { Badge } from '@/components/ui/badge';

const fieldSchema = z.object({
    name: z.string().min(1, "Name is required"),
    id: z.string().min(1, "ID is required"),
    type: z.enum(['text', 'number', 'currency', 'select', 'multi_select', 'toggle', 'tags', 'textarea', 'image', 'date', 'time', 'duration', 'url', 'email', 'phone']),
    description: z.string().optional(),
    isRequired: z.boolean().default(false),
    isSearchable: z.boolean().default(true),
    showInList: z.boolean().default(true),
    showInCard: z.boolean().default(false),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    order: z.number().default(0),
});

interface FieldEditorProps {
    field?: ModuleFieldDefinition;
    onSave: (field: ModuleFieldDefinition) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FieldEditor({ field, onSave, open, onOpenChange }: FieldEditorProps) {
    const [options, setOptions] = useState<string[]>(field?.options || []);
    const [newOption, setNewOption] = useState('');

    const form = useForm<z.infer<typeof fieldSchema>>({
        resolver: zodResolver(fieldSchema),
        defaultValues: field || {
            name: '',
            id: '',
            type: 'text',
            description: '',
            isRequired: false,
            isSearchable: true,
            showInList: true,
            showInCard: false,
            order: 0,
        },
    });

    const onSubmit = (values: z.infer<typeof fieldSchema>) => {
        onSave({
            ...values,
            id: field?.id || values.id || generateFieldId(),
            options: ['select', 'multi_select'].includes(values.type) ? options : undefined,
        } as ModuleFieldDefinition);
        onOpenChange(false);
        form.reset();
        setOptions([]);
    };

    const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!field && !form.getValues('id')) {
            form.setValue('id', slugify(e.target.value));
        }
    };

    const addOption = (e: React.FormEvent) => {
        e.preventDefault();
        if (newOption.trim() && !options.includes(newOption.trim())) {
            setOptions([...options, newOption.trim()]);
            setNewOption('');
        }
    };

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const watchType = form.watch('type');
    const showOptions = ['select', 'multi_select'].includes(watchType);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{field ? 'Edit Field' : 'Add New Field'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Field Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Bed Type" {...field} onBlur={(e) => {
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
                                name="id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Field ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="bed_type" {...field} />
                                        </FormControl>
                                        <FormDescription>Unique identifier (snake_case)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Field Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
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
                                name="placeholder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Placeholder (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Short hint text..." {...field} />
                                        </FormControl>
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
                                    <FormLabel>Description / Help Text</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Explain what this field is for..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showOptions && (
                            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                                <FormLabel>Options</FormLabel>
                                <div className="flex gap-2">
                                    <Input
                                        value={newOption}
                                        onChange={e => setNewOption(e.target.value)}
                                        placeholder="Type option and press enter"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(e); } }}
                                    />
                                    <Button type="button" onClick={addOption} size="icon">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {options.map((opt, i) => (
                                        <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1">
                                            {opt}
                                            <Button type="button" variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => removeOption(i)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                    {options.length === 0 && <span className="text-sm text-muted-foreground italic">No options added yet</span>}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                            <FormField
                                control={form.control}
                                name="isRequired"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Required</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isSearchable"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Searchable</FormLabel>
                                            <FormDescription className="text-xs">Include in RAG/Search</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="showInList"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Show in List</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="showInCard"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Show in Card</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">Save Field</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
