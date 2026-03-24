'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    CatalogCards,
    CompareTable,
    ServiceList,
    BookingFlow,
    LocationCard,
    ContactCard,
    GalleryGrid,
    InfoTable,
    TextWithSuggestions,
    GreetingCard,
    DEFAULT_THEME,
} from '@/components/relay/blocks';
import type { CatalogItem, ActivityItem, ContactMethod, RelayBlock } from '@/components/relay/blocks';
import { BlockRenderer } from '@/components/relay/blocks';
import type { RelayBlockConfigDetail } from '@/actions/relay-actions';
import {
    updateRelayBlockConfigAction,
    deleteRelayBlockConfigAction,
    regenerateBlockTemplateAction,
    clearAllRelayBlockConfigsAction,
    generateMissingRelayBlocksAction,
} from '@/actions/relay-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import {
    ChevronDown,
    ChevronRight,
    Zap,
    Plus,
    Save,
    Trash2,
    RefreshCw,
    Sparkles,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const BLOCK_TYPES = [
    'catalog', 'rooms', 'products', 'services', 'menu', 'listings',
    'compare',
    'activities', 'experiences', 'classes', 'treatments',
    'book', 'reserve', 'appointment', 'inquiry',
    'location', 'directions',
    'contact',
    'gallery', 'photos',
    'info', 'faq', 'details',
    'greeting', 'welcome',
    'text',
] as const;

const BLOCK_TYPE_COLORS: Record<string, string> = {
    catalog: 'bg-blue-100 text-blue-800',
    rooms: 'bg-blue-100 text-blue-800',
    products: 'bg-blue-100 text-blue-800',
    services: 'bg-blue-100 text-blue-800',
    menu: 'bg-blue-100 text-blue-800',
    listings: 'bg-blue-100 text-blue-800',
    compare: 'bg-amber-100 text-amber-800',
    activities: 'bg-purple-100 text-purple-800',
    experiences: 'bg-purple-100 text-purple-800',
    classes: 'bg-purple-100 text-purple-800',
    treatments: 'bg-purple-100 text-purple-800',
    book: 'bg-indigo-100 text-indigo-800',
    reserve: 'bg-indigo-100 text-indigo-800',
    appointment: 'bg-indigo-100 text-indigo-800',
    inquiry: 'bg-indigo-100 text-indigo-800',
    location: 'bg-teal-100 text-teal-800',
    directions: 'bg-teal-100 text-teal-800',
    contact: 'bg-pink-100 text-pink-800',
    gallery: 'bg-orange-100 text-orange-800',
    photos: 'bg-orange-100 text-orange-800',
    info: 'bg-green-100 text-green-800',
    faq: 'bg-green-100 text-green-800',
    details: 'bg-green-100 text-green-800',
    greeting: 'bg-red-100 text-red-800',
    welcome: 'bg-red-100 text-red-800',
    text: 'bg-gray-100 text-gray-800',
};

const CATALOG_ITEMS: CatalogItem[] = [
    {
        id: 'item-1',
        name: 'Sample Item',
        price: 5000,
        currency: 'INR',
        unit: '/each',
        subtitle: 'Sample subtitle',
        emoji: '📦',
        color: '#A2845B',
        colorEnd: '#BFA07A',
        rating: 4.5,
        reviewCount: 42,
        badges: ['Popular'],
        features: ['Feature A', 'Feature B'],
        specs: [{ label: 'Type', value: 'Standard' }],
        maxCapacity: 2,
    },
];

const SERVICE_ITEMS: ActivityItem[] = [
    { id: 'svc-1', name: 'Sample Service', description: 'A sample service', icon: '⭐', price: '₹2,000', duration: '60 min', category: 'General', bookable: true },
];

const CONTACT_METHODS: ContactMethod[] = [
    { type: 'phone', label: 'Phone', value: '+91 98765 43210', icon: '📞' },
    { type: 'email', label: 'Email', value: 'hello@example.com', icon: '📧' },
];

function generateMockBlock(blockType: string): RelayBlock {
    switch (blockType) {
        case 'catalog':
        case 'rooms':
        case 'products':
        case 'services':
        case 'menu':
        case 'listings':
            return { type: blockType, items: CATALOG_ITEMS, showBookButton: true, bookButtonLabel: 'View' };
        case 'compare':
            return {
                type: blockType, items: CATALOG_ITEMS, compareFields: [
                    { label: 'Price', key: 'price' },
                    { label: 'Rating', key: 'rating' },
                ],
            };
        case 'activities':
        case 'experiences':
        case 'classes':
        case 'treatments':
            return { type: blockType, items: SERVICE_ITEMS };
        case 'book':
        case 'reserve':
        case 'appointment':
        case 'inquiry':
            return { type: blockType, items: CATALOG_ITEMS, dateMode: 'single', guestMode: 'counter', headerLabel: 'Book Now', selectLabel: 'Select' };
        case 'location':
        case 'directions':
            return { type: blockType, location: { name: 'Business Location', address: '123 Main St', area: 'City Center', emoji: '📍', mapGradient: ['#A2845B', '#BFA07A'] as [string, string], directions: [], actions: [] } };
        case 'contact':
            return { type: blockType, methods: CONTACT_METHODS };
        case 'gallery':
        case 'photos':
            return { type: blockType, items: [{ emoji: '📷', label: 'Photo 1', span: 2 }, { emoji: '🖼️', label: 'Photo 2' }] };
        case 'info':
        case 'faq':
        case 'details':
            return { type: blockType, items: [{ label: 'Hours', value: '9 AM - 6 PM' }, { label: 'Phone', value: '+91 98765 43210' }] };
        case 'greeting':
        case 'welcome':
            return { type: blockType, brand: { name: 'Your Business', emoji: '👋', tagline: 'Welcome!', quickActions: [] } };
        default:
            return { type: 'text', text: 'Welcome! How can I help you today?', suggestions: ['Learn more', 'Contact us'] };
    }
}

function getBlockTypeColor(blockType: string): string {
    return BLOCK_TYPE_COLORS[blockType] || 'bg-gray-100 text-gray-800';
}

interface BlockGalleryProps {
    configs: RelayBlockConfigDetail[];
}

export function BlockGallery({ configs: initialConfigs }: BlockGalleryProps) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [generatingAll, setGeneratingAll] = useState(false);
    const [clearingAll, setClearingAll] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const uniqueBlockTypes = useMemo(() => {
        const types = new Set(configs.map(c => c.blockType));
        return Array.from(types).sort();
    }, [configs]);

    const filteredConfigs = useMemo(() => {
        if (activeFilter === 'All') return configs;
        return configs.filter(c => c.blockType === activeFilter);
    }, [configs, activeFilter]);

    const handleConfigUpdate = useCallback((id: string, updated: RelayBlockConfigDetail) => {
        setConfigs(prev => prev.map(c => c.id === id ? updated : c));
    }, []);

    const handleConfigDelete = useCallback((id: string) => {
        setConfigs(prev => prev.filter(c => c.id !== id));
    }, []);

    const handleGenerateAll = async () => {
        setGeneratingAll(true);
        try {
            const result = await generateMissingRelayBlocksAction();
            if (result.success) {
                toast.success(`Generated ${result.generated} block config(s)${result.errors.length > 0 ? `, ${result.errors.length} error(s)` : ''}`);
                if (result.generated > 0) {
                    window.location.reload();
                }
            } else {
                toast.error('Failed to generate block configs');
            }
        } catch {
            toast.error('Generation failed');
        } finally {
            setGeneratingAll(false);
        }
    };

    const handleClearAll = async () => {
        setClearingAll(true);
        try {
            const result = await clearAllRelayBlockConfigsAction();
            if (result.success) {
                toast.success(`Cleared ${result.count} block config(s)`);
                setConfigs([]);
            } else {
                toast.error(result.error || 'Failed to clear');
            }
        } catch {
            toast.error('Clear failed');
        } finally {
            setClearingAll(false);
            setShowClearConfirm(false);
        }
    };

    const handleConfigRegenerated = useCallback((id: string, updated: Partial<RelayBlockConfigDetail>) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    size="sm"
                    onClick={handleGenerateAll}
                    disabled={generatingAll}
                >
                    {generatingAll ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                    ) : (
                        <><Sparkles className="mr-2 h-4 w-4" />Generate All Missing</>
                    )}
                </Button>

                {!showClearConfirm ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearConfirm(true)}
                        disabled={configs.length === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Configs
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700">Delete all {configs.length} configs?</span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleClearAll}
                            disabled={clearingAll}
                            className="h-7"
                        >
                            {clearingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowClearConfirm(false)}
                            className="h-7"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={activeFilter === 'All' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter('All')}
                >
                    All ({configs.length})
                </Button>
                {uniqueBlockTypes.map(type => (
                    <Button
                        key={type}
                        variant={activeFilter === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveFilter(type)}
                    >
                        {type} ({configs.filter(c => c.blockType === type).length})
                    </Button>
                ))}
            </div>

            {filteredConfigs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Block Configs Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Block configs are auto-generated when modules are created, or use "Generate All Missing" above.
                        </p>
                        <Button asChild>
                            <Link href="/admin/modules/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Modules
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredConfigs.map(config => (
                        <ConfigCard
                            key={config.id}
                            config={config}
                            onUpdate={handleConfigUpdate}
                            onDelete={handleConfigDelete}
                            onRegenerated={handleConfigRegenerated}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ConfigCardProps {
    config: RelayBlockConfigDetail;
    onUpdate: (id: string, updated: RelayBlockConfigDetail) => void;
    onDelete: (id: string) => void;
    onRegenerated: (id: string, updated: Partial<RelayBlockConfigDetail>) => void;
}

function ConfigCard({ config, onUpdate, onDelete, onRegenerated }: ConfigCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState(config);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const mockBlock = useMemo(() => generateMockBlock(draft.blockType), [draft.blockType]);

    const updateDraft = useCallback(<K extends keyof RelayBlockConfigDetail>(
        key: K,
        value: RelayBlockConfigDetail[K]
    ) => {
        setDraft(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateDataSchema = useCallback((
        key: string,
        value: string | number | string[]
    ) => {
        setDraft(prev => ({
            ...prev,
            dataSchema: { ...prev.dataSchema, [key]: value },
        }));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const { id, ...updates } = draft;
        const result = await updateRelayBlockConfigAction(id, updates);
        if (result.success) {
            toast.success('Block config saved');
            onUpdate(config.id, draft);
        } else {
            toast.error(result.error || 'Failed to save');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete block config "${config.label}"? This cannot be undone.`)) return;
        setDeleting(true);
        const result = await deleteRelayBlockConfigAction(config.id);
        if (result.success) {
            toast.success('Block config deleted');
            onDelete(config.id);
        } else {
            toast.error(result.error || 'Failed to delete');
        }
        setDeleting(false);
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const result = await regenerateBlockTemplateAction(config.id);
            if (result.success) {
                toast.success('Template regenerated');
                window.location.reload();
            } else {
                toast.error(result.error || 'Regeneration failed');
            }
        } catch {
            toast.error('Regeneration failed');
        } finally {
            setRegenerating(false);
        }
    };

    const isAiGenerated = config.blockTypeTemplate?.generatedBy === 'claude';
    const subcategory = config.blockTypeTemplate?.subcategory;

    return (
        <Card className="border border-[#e5e5e5]">
            <button
                type="button"
                className="w-full text-left px-5 py-4 flex items-center gap-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                }
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${getBlockTypeColor(config.blockType)}`}>
                    {config.blockType}
                </span>
                <span className="font-medium truncate">{config.label}</span>
                {config.moduleSlug && (
                    <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">
                        {config.moduleSlug}
                    </Badge>
                )}
                {subcategory && (
                    <Badge variant="outline" className="text-xs shrink-0 hidden md:inline-flex bg-[#f5f5f5]">
                        {subcategory}
                    </Badge>
                )}
                {isAiGenerated && (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="ml-auto shrink-0">
                    <Badge
                        variant={config.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                    >
                        {config.status}
                    </Badge>
                </span>
            </button>

            {isOpen && (
                <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-5" />
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3 space-y-4">
                            {config.blockTypeTemplate && (
                                <div className="rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {isAiGenerated && <Sparkles className="h-4 w-4 text-amber-500" />}
                                        <span>AI-Generated Template</span>
                                        {config.blockTypeTemplate.generatedAt && (
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {new Date(config.blockTypeTemplate.generatedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {config.dataSchema?.displayTemplate && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Display Template</p>
                                            <pre className="text-xs font-mono bg-white rounded p-2 border border-[#e5e5e5] whitespace-pre-wrap">
                                                {config.dataSchema.displayTemplate}
                                            </pre>
                                        </div>
                                    )}

                                    {config.blockTypeTemplate.sampleData && Object.keys(config.blockTypeTemplate.sampleData).length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Sample Data</p>
                                            <div className="bg-white rounded border border-[#e5e5e5] divide-y divide-[#e5e5e5]">
                                                {Object.entries(config.blockTypeTemplate.sampleData).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between px-3 py-1.5 text-xs">
                                                        <span className="font-mono text-muted-foreground">{key}</span>
                                                        <span className="text-right truncate ml-4">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span>Source: {config.blockTypeTemplate.generatedBy}</span>
                                        {config.blockTypeTemplate.subcategory && (
                                            <span>| Subcategory: {config.blockTypeTemplate.subcategory}</span>
                                        )}
                                        {config.blockTypeTemplate.isDefault && (
                                            <Badge variant="outline" className="text-xs py-0">fallback</Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>Block Type</Label>
                                <Select
                                    value={draft.blockType}
                                    onValueChange={v => updateDraft('blockType', v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOCK_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Label</Label>
                                <Input
                                    className="mt-1"
                                    value={draft.label}
                                    onChange={e => updateDraft('label', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    className="mt-1"
                                    rows={2}
                                    value={draft.description || ''}
                                    onChange={e => updateDraft('description', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Display Template</Label>
                                <Textarea
                                    className="mt-1 font-mono text-xs"
                                    rows={2}
                                    placeholder="{{name}} — {{price}} per night"
                                    value={draft.dataSchema?.displayTemplate || ''}
                                    onChange={e => updateDataSchema('displayTemplate', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Max Items</Label>
                                    <Input
                                        className="mt-1"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={draft.dataSchema?.maxItems ?? ''}
                                        onChange={e => updateDataSchema('maxItems', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={draft.status}
                                        onValueChange={v => updateDraft('status', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">active</SelectItem>
                                            <SelectItem value="inactive">inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Source Fields</Label>
                                <Input
                                    className="mt-1"
                                    placeholder="name, price, description"
                                    value={(draft.dataSchema?.sourceFields || []).join(', ')}
                                    onChange={e =>
                                        updateDataSchema(
                                            'sourceFields',
                                            e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                        )
                                    }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Comma-separated field names</p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button onClick={handleSave} disabled={saving} size="sm">
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRegenerate}
                                    disabled={regenerating || !config.moduleId}
                                >
                                    {regenerating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Regenerating...</>
                                    ) : (
                                        <><RefreshCw className="mr-2 h-4 w-4" />Regenerate Template</>
                                    )}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <Label className="mb-2 block">Live Preview</Label>
                            <div className="max-w-[360px] mx-auto bg-[#FAFAF6] rounded-2xl p-4 shadow-inner border border-gray-100">
                                <BlockRenderer block={mockBlock} theme={DEFAULT_THEME} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
