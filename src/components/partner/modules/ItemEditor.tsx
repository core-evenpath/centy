'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Loader2, Plus, Trash2, X, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { SUPPORTED_CURRENCIES } from '@/lib/modules/constants';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

interface ItemEditorProps {
    initialItem?: Partial<ModuleItem>;
    module: PartnerModule;
    schema: ModuleSchema;
    onSave: (item: Partial<ModuleItem>) => Promise<void>;
    onCancel: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadingImage {
    id: string;
    file: File;
    progress: number;
    preview: string;
}

export function ItemEditor({ initialItem, module, schema, onSave, onCancel }: ItemEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [uploadedImages, setUploadedImages] = useState<string[]>(initialItem?.images || []);
    const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Combine all fields (schema fields + custom fields)
    // ModuleFieldDefinition has conditionalOn; PartnerCustomField has addedAt/addedBy.
    // Both share core rendering properties (id, name, type, order, etc.).
    const allFields = [
        ...schema.fields,
        ...(module.customFields || []).map(cf => ({
            ...cf,
            order: cf.order ?? (schema.fields.length + 100),
        })),
    ].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Storage key per field. Schema fields use the bare `name` so block
    // `reads[]` (always bare names) finds the value during render —
    // sample-data seeding already writes this way. Partner custom fields
    // are never read by blocks; they keep their unique `id` as the
    // storage key so two custom fields with the same human label can't
    // collide.
    const getStorageKey = (field: any): string =>
        'addedAt' in field ? field.id : field.name;

    // Hydrate `fields` defaults from the initial item, accepting both the
    // canonical key (`field.name`) and the legacy key (`field.id`, which
    // schema fields produce as `fld_<name>`). Anything still empty falls
    // back to the schema's `defaultValue` so blocks always have data.
    const buildFieldDefaults = (): Record<string, any> => {
        const seed = (initialItem?.fields ?? {}) as Record<string, any>;
        const out: Record<string, any> = {};
        for (const f of allFields) {
            const key = getStorageKey(f);
            const fromCanonical = seed[key];
            const fromLegacy = key !== (f as any).id ? seed[(f as any).id] : undefined;
            if (fromCanonical !== undefined) {
                out[key] = fromCanonical;
            } else if (fromLegacy !== undefined) {
                // Auto-migrate on next save: read legacy, write canonical.
                out[key] = fromLegacy;
            } else if ((f as any).defaultValue !== undefined && (f as any).defaultValue !== null) {
                out[key] = (f as any).defaultValue;
            }
        }
        return out;
    };

    const defaultValues = {
        name: '',
        description: '',
        category: module.settings.defaultCategory || 'General',
        isActive: true,
        isFeatured: false,
        price: 0,
        currency: module.settings.defaultCurrency || 'INR',
        ...initialItem,
        // Override after the spread so our merged-with-defaults version
        // wins over `initialItem.fields` (which would otherwise leak
        // legacy `fld_<name>` keys back into the form state).
        fields: buildFieldDefaults(),
        images: initialItem?.images ?? [],
    };

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues
    });

    const watchedFields = watch();

    // Sync uploaded images to form
    useEffect(() => {
        setValue('images', uploadedImages);
        if (uploadedImages.length > 0) {
            setValue('thumbnail', uploadedImages[0]);
        } else {
            setValue('thumbnail', undefined);
        }
    }, [uploadedImages, setValue]);

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            return `Invalid file type. Accepted: JPEG, PNG, WebP`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Max size: 5MB`;
        }
        return null;
    };

    const uploadImage = useCallback(async (file: File): Promise<string | null> => {
        const uploadId = generateUUID();
        const ext = file.name.split('.').pop() || 'jpg';
        const storagePath = `partners/${module.partnerId}/modules/${module.moduleSlug}/${uploadId}.${ext}`;

        // Create preview URL
        const preview = URL.createObjectURL(file);

        // Add to uploading state
        setUploadingImages(prev => [...prev, { id: uploadId, file, progress: 0, preview }]);

        try {
            const storageRef = ref(storage, storagePath);

            // Update progress to show upload started
            setUploadingImages(prev =>
                prev.map(img => img.id === uploadId ? { ...img, progress: 30 } : img)
            );

            // Upload with explicit content type for Firebase Storage rules validation
            await uploadBytes(storageRef, file, { contentType: file.type });

            // Update progress to show upload complete, getting URL
            setUploadingImages(prev =>
                prev.map(img => img.id === uploadId ? { ...img, progress: 80 } : img)
            );

            const downloadURL = await getDownloadURL(storageRef);

            // Remove from uploading state
            setUploadingImages(prev => prev.filter(img => img.id !== uploadId));

            // Clean up preview URL
            URL.revokeObjectURL(preview);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading image:', error);
            // Remove from uploading state on error
            setUploadingImages(prev => prev.filter(img => img.id !== uploadId));
            URL.revokeObjectURL(preview);
            return null;
        }
    }, [module.partnerId, module.moduleSlug]);

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const remainingSlots = MAX_IMAGES - uploadedImages.length - uploadingImages.length;

        if (remainingSlots <= 0) {
            toast.error(`Maximum ${MAX_IMAGES} images allowed`);
            return;
        }

        const filesToUpload = fileArray.slice(0, remainingSlots);

        for (const file of filesToUpload) {
            const error = validateFile(file);
            if (error) {
                toast.error(`${file.name}: ${error}`);
                continue;
            }

            const url = await uploadImage(file);
            if (url) {
                setUploadedImages(prev => [...prev, url]);
                toast.success(`Uploaded ${file.name}`);
            } else {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
    }, [uploadedImages.length, uploadingImages.length, uploadImage]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [handleFiles]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Reset input to allow selecting same file again
        e.target.value = '';
    }, [handleFiles]);

    const removeImage = useCallback((indexToRemove: number) => {
        setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);

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

    // Helper to render dynamic input based on field type. Every type
    // in the ModuleFieldType union has a dedicated renderer so the
    // partner-side editor honours the schema admin defined — no silent
    // fallback to plain text. Validation hints (min/max/length/pattern)
    // are forwarded to native input attributes when applicable.
    const renderFieldInput = (field: any) => {
        const storageKey = getStorageKey(field);
        const fieldId = `fields.${storageKey}`;
        const value = watchedFields.fields?.[storageKey];
        const v = field.validation ?? {};

        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea
                        {...register(fieldId)}
                        placeholder={field.placeholder}
                        rows={3}
                        minLength={v.minLength}
                        maxLength={v.maxLength}
                    />
                );

            case 'number':
            case 'currency':
            case 'duration':
                return (
                    <Input
                        type="number"
                        step={field.type === 'currency' ? '0.01' : 'any'}
                        {...register(fieldId)}
                        placeholder={field.placeholder}
                        min={v.min}
                        max={v.max}
                    />
                );

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

            case 'multi_select': {
                // Schema-defined multi_select stores an array of option
                // strings. A scrollable checkbox group keeps the UI
                // simple without pulling in a chip-picker dependency.
                const arr: string[] = Array.isArray(value) ? value : [];
                const toggleOption = (opt: string, checked: boolean) => {
                    const next = checked
                        ? Array.from(new Set([...arr, opt]))
                        : arr.filter((o) => o !== opt);
                    setValue(fieldId, next);
                };
                return (
                    <div className="rounded-md border p-2 max-h-40 overflow-y-auto space-y-1">
                        {(field.options ?? []).length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">
                                No options defined for this field.
                            </p>
                        ) : (
                            field.options.map((opt: string) => (
                                <label
                                    key={opt}
                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={arr.includes(opt)}
                                        onChange={(e) => toggleOption(opt, e.target.checked)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))
                        )}
                    </div>
                );
            }

            case 'tags': {
                // Free-form tags come from a single comma-separated
                // input — pasting CSV is the partner's most common
                // ingest pattern. Stored as string[] for downstream
                // consumers (search, RAG, block renderers).
                const arr: string[] = Array.isArray(value) ? value : [];
                return (
                    <Input
                        type="text"
                        value={arr.join(', ')}
                        placeholder={field.placeholder || 'comma, separated, tags'}
                        onChange={(e) =>
                            setValue(
                                fieldId,
                                e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                            )
                        }
                    />
                );
            }

            case 'url':
                return (
                    <Input
                        type="url"
                        {...register(fieldId)}
                        placeholder={field.placeholder || 'https://example.com'}
                        pattern={v.pattern}
                    />
                );

            case 'email':
                return (
                    <Input
                        type="email"
                        {...register(fieldId)}
                        placeholder={field.placeholder || 'name@example.com'}
                        pattern={v.pattern}
                    />
                );

            case 'phone':
                return (
                    <Input
                        type="tel"
                        {...register(fieldId)}
                        placeholder={field.placeholder || '+1 555 555 5555'}
                        pattern={v.pattern}
                    />
                );

            case 'image':
                // Schema-level image fields hold a single URL — the
                // canonical multi-image gallery lives on the dedicated
                // Images tab. Partner pastes a URL here; preview
                // appears below when it parses.
                return (
                    <div className="space-y-2">
                        <Input
                            type="url"
                            {...register(fieldId)}
                            placeholder={field.placeholder || 'https://…/image.jpg'}
                        />
                        {typeof value === 'string' && value.startsWith('http') && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={value}
                                alt=""
                                className="h-16 w-16 rounded border object-cover"
                            />
                        )}
                    </div>
                );

            case 'date':
                return <Input type="date" {...register(fieldId)} />;

            case 'time':
                return <Input type="time" {...register(fieldId)} />;

            case 'text':
            default:
                return (
                    <Input
                        type="text"
                        {...register(fieldId)}
                        placeholder={field.placeholder}
                        minLength={v.minLength}
                        maxLength={v.maxLength}
                        pattern={v.pattern}
                    />
                );
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
                        <CardContent className="pt-6 space-y-4">
                            {/* Uploaded Images Grid */}
                            {(uploadedImages.length > 0 || uploadingImages.length > 0) && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                                    {uploadedImages.map((url, index) => (
                                        <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                                            <Image
                                                src={url}
                                                alt={`Image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            />
                                            {index === 0 && (
                                                <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                                                    Thumbnail
                                                </Badge>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {uploadingImages.map((img) => (
                                        <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                            <Image
                                                src={img.preview}
                                                alt="Uploading"
                                                fill
                                                className="object-cover opacity-50"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                                                    <span className="text-xs">{img.progress}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Zone */}
                            {uploadedImages.length + uploadingImages.length < MAX_IMAGES && (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative text-center py-12 border-2 border-dashed rounded-lg transition-colors ${
                                        isDragging
                                            ? 'border-primary bg-primary/5'
                                            : 'border-muted-foreground/25 bg-muted/10 hover:border-muted-foreground/50'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                        multiple
                                        onChange={handleFileInputChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        {isDragging ? (
                                            <Upload className="h-10 w-10 text-primary" />
                                        ) : (
                                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">
                                                {isDragging ? 'Drop images here' : 'Drag and drop images here'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                or click to browse
                                            </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            JPEG, PNG, WebP up to 5MB ({MAX_IMAGES - uploadedImages.length - uploadingImages.length} remaining)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Info text */}
                            <p className="text-xs text-muted-foreground">
                                The first image will be used as the thumbnail. Drag images to reorder (coming soon).
                            </p>
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
