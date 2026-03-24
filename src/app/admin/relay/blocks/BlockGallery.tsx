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
import { ChevronDown, ChevronRight, Zap, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CATALOG_ITEMS: CatalogItem[] = [
    {
        id: 'deluxe-suite',
        name: 'Deluxe Suite',
        price: 12500,
        originalPrice: 15000,
        currency: 'INR',
        unit: '/night',
        subtitle: 'Sea-facing · 48 sqm',
        emoji: '🏨',
        color: '#A2845B',
        colorEnd: '#BFA07A',
        rating: 4.8,
        reviewCount: 124,
        badges: ['Popular', 'Sea View'],
        features: ['King bed', 'Balcony', 'Minibar', 'Rain shower'],
        specs: [
            { label: 'Size', value: '48 sqm' },
            { label: 'View', value: 'Ocean' },
            { label: 'Bed', value: 'King' },
        ],
        maxCapacity: 3,
    },
    {
        id: 'standard-room',
        name: 'Standard Room',
        price: 6500,
        currency: 'INR',
        unit: '/night',
        subtitle: 'Garden view · 28 sqm',
        emoji: '🛏️',
        color: '#6B8E7B',
        colorEnd: '#8BB09E',
        rating: 4.5,
        reviewCount: 89,
        badges: ['Value Pick'],
        features: ['Queen bed', 'Work desk', 'Free WiFi'],
        specs: [
            { label: 'Size', value: '28 sqm' },
            { label: 'View', value: 'Garden' },
            { label: 'Bed', value: 'Queen' },
        ],
        maxCapacity: 2,
    },
];

const SERVICE_ITEMS: ActivityItem[] = [
    { id: 'deep-tissue', name: 'Deep Tissue Massage', description: 'Full body therapeutic massage', icon: '💆', price: '₹3,500', duration: '60 min', category: 'Massage', bookable: true },
    { id: 'aromatherapy', name: 'Aromatherapy Session', description: 'Essential oils relaxation therapy', icon: '🌿', price: '₹2,800', duration: '45 min', category: 'Therapy', bookable: true },
    { id: 'facial', name: 'Gold Facial', description: 'Premium anti-aging facial treatment', icon: '✨', price: '₹4,200', duration: '75 min', category: 'Facial', bookable: true },
];

const CONTACT_METHODS: ContactMethod[] = [
    { type: 'whatsapp', label: 'WhatsApp', value: '+91 98765 43210', icon: '💬' },
    { type: 'phone', label: 'Front Desk', value: '+91 22 2345 6789', icon: '📞' },
    { type: 'email', label: 'Reservations', value: 'book@grandresort.com', icon: '📧' },
    { type: 'website', label: 'Website', value: 'grandresort.com', icon: '🌐' },
];

const LOCATION_DATA = {
    name: 'The Grand Resort & Spa',
    address: '123 Marine Drive, South Mumbai',
    area: 'Colaba, Mumbai 400005',
    emoji: '📍',
    mapGradient: ['#A2845B', '#BFA07A'] as [string, string],
    directions: [
        { icon: '✈️', label: 'From Airport', detail: '45 min via Western Express Highway' },
        { icon: '🚂', label: 'From CST Station', detail: '20 min via taxi' },
    ],
    actions: ['Get Directions', 'Share Location'],
};

const GALLERY_ITEMS = [
    { emoji: '🏊', label: 'Infinity Pool', span: 2 },
    { emoji: '🍽️', label: 'Restaurant' },
    { emoji: '🛏️', label: 'Suite' },
    { emoji: '🧖', label: 'Spa', span: 2 },
    { emoji: '🌅', label: 'Beach' },
];

const INFO_ITEMS = [
    { label: 'Check-in', value: '2:00 PM' },
    { label: 'Check-out', value: '11:00 AM' },
    { label: 'WiFi', value: 'Free — all areas' },
    { label: 'Parking', value: 'Valet — ₹500/day' },
    { label: 'Pool Hours', value: '6 AM – 10 PM' },
    { label: 'Pets', value: 'Not allowed' },
];

const BRAND_DATA = {
    name: 'The Grand Resort',
    emoji: '🏨',
    tagline: 'Where luxury meets the sea',
    quickActions: [
        { icon: '🛏️', label: 'Browse rooms', prompt: 'Show me available rooms' },
        { icon: '🍽️', label: 'See menu', prompt: "What's on the menu?" },
        { icon: '💆', label: 'Spa services', prompt: 'Tell me about spa treatments' },
        { icon: '📍', label: 'Directions', prompt: 'How do I get there?' },
    ],
};

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

function generateMockBlock(blockType: string): RelayBlock {
    switch (blockType) {
        case 'catalog':
        case 'rooms':
        case 'products':
        case 'services':
        case 'menu':
        case 'listings':
            return { type: blockType, items: CATALOG_ITEMS, showBookButton: true, bookButtonLabel: 'Reserve' };
        case 'compare':
            return {
                type: blockType, items: CATALOG_ITEMS, compareFields: [
                    { label: 'Price / night', key: 'price' },
                    { label: 'Rating', key: 'rating' },
                    { label: 'Size', key: 'spec:Size' },
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
            return { type: blockType, items: CATALOG_ITEMS, dateMode: 'range', guestMode: 'counter', headerLabel: 'Book your stay', selectLabel: 'Select room' };
        case 'location':
        case 'directions':
            return { type: blockType, location: LOCATION_DATA };
        case 'contact':
            return { type: blockType, methods: CONTACT_METHODS };
        case 'gallery':
        case 'photos':
            return { type: blockType, items: GALLERY_ITEMS };
        case 'info':
        case 'faq':
        case 'details':
            return { type: blockType, items: INFO_ITEMS };
        case 'greeting':
        case 'welcome':
            return { type: blockType, brand: BRAND_DATA };
        default:
            return {
                type: 'text',
                text: 'Welcome! I can help you with room availability, dining options, spa bookings, and local recommendations.',
                suggestions: ['Show me rooms', 'Restaurant menu', 'Spa treatments'],
            };
    }
}

interface BlockDef {
    component: string;
    aliases: string[];
    previews: Array<{ label?: string; render: () => React.ReactNode }>;
}

const BLOCK_DEFS: BlockDef[] = [
    {
        component: 'CatalogCards',
        aliases: ['catalog', 'rooms', 'products', 'services', 'menu', 'listings'],
        previews: [{
            render: () => (
                <CatalogCards
                    items={CATALOG_ITEMS}
                    theme={DEFAULT_THEME}
                    showBookButton
                    bookButtonLabel="Reserve"
                />
            ),
        }],
    },
    {
        component: 'CompareTable',
        aliases: ['compare'],
        previews: [{
            render: () => (
                <CompareTable
                    items={CATALOG_ITEMS}
                    theme={DEFAULT_THEME}
                    compareFields={[
                        { label: 'Price / night', key: 'price' },
                        { label: 'Rating', key: 'rating' },
                        { label: 'Size', key: 'spec:Size' },
                        { label: 'View', key: 'spec:View' },
                        { label: 'Bed Type', key: 'spec:Bed' },
                    ]}
                />
            ),
        }],
    },
    {
        component: 'ServiceList',
        aliases: ['activities', 'experiences', 'classes', 'treatments'],
        previews: [{
            render: () => (
                <ServiceList
                    items={SERVICE_ITEMS}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
    {
        component: 'BookingFlow',
        aliases: ['book', 'reserve', 'appointment', 'inquiry'],
        previews: [
            {
                label: 'Hotel Booking (date range)',
                render: () => (
                    <BookingFlow
                        items={CATALOG_ITEMS}
                        theme={DEFAULT_THEME}
                        dateMode="range"
                        guestMode="counter"
                        headerLabel="Book your stay"
                        selectLabel="Select room"
                    />
                ),
            },
            {
                label: 'Restaurant Booking (single date)',
                render: () => (
                    <BookingFlow
                        items={[
                            { id: 'table-2', name: 'Table for 2', price: 0, currency: 'INR', emoji: '🍽️', color: '#D94839', colorEnd: '#E8685B', maxCapacity: 2 },
                            { id: 'table-4', name: 'Table for 4', price: 0, currency: 'INR', emoji: '🍽️', color: '#3A9B70', colorEnd: '#5ABF90', maxCapacity: 4 },
                        ]}
                        theme={DEFAULT_THEME}
                        dateMode="single"
                        guestMode="counter"
                        headerLabel="Reserve a table"
                        selectLabel="Select table"
                    />
                ),
            },
        ],
    },
    {
        component: 'LocationCard',
        aliases: ['location', 'directions'],
        previews: [{
            render: () => (
                <LocationCard
                    location={LOCATION_DATA}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
    {
        component: 'ContactCard',
        aliases: ['contact'],
        previews: [{
            render: () => (
                <ContactCard
                    methods={CONTACT_METHODS}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
    {
        component: 'GalleryGrid',
        aliases: ['gallery', 'photos'],
        previews: [{
            render: () => (
                <GalleryGrid
                    items={GALLERY_ITEMS}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
    {
        component: 'InfoTable',
        aliases: ['info', 'faq', 'details'],
        previews: [{
            render: () => (
                <InfoTable
                    items={INFO_ITEMS}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
    {
        component: 'TextWithSuggestions',
        aliases: ['(default fallback)'],
        previews: [{
            render: () => (
                <TextWithSuggestions
                    text="Welcome! I'm your AI concierge. I can help you with room availability, dining options, spa bookings, and local recommendations. What would you like to know?"
                    suggestions={['Show me rooms', 'Restaurant menu', 'Spa treatments', 'How to reach you', 'Check-in time']}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
    {
        component: 'GreetingCard',
        aliases: ['greeting', 'welcome'],
        previews: [{
            render: () => (
                <GreetingCard
                    brandName="The Grand Resort"
                    brandEmoji="🏨"
                    tagline="Where luxury meets the sea"
                    quickActions={BRAND_DATA.quickActions}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
];

function configMatchesBlock(config: RelayBlockConfigDetail, block: BlockDef): boolean {
    return block.aliases.some(alias => alias === config.blockType);
}

interface BlockGalleryProps {
    configs: RelayBlockConfigDetail[];
}

export function BlockGallery({ configs: initialConfigs }: BlockGalleryProps) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [activeFilter, setActiveFilter] = useState<string>('All');

    const filteredBlocks = useMemo(() => {
        if (activeFilter === 'All') return BLOCK_DEFS;
        return BLOCK_DEFS.filter(b => b.component === activeFilter);
    }, [activeFilter]);

    const configsForBlock = (block: BlockDef): RelayBlockConfigDetail[] => {
        return configs.filter(c => configMatchesBlock(c, block));
    };

    const handleConfigUpdate = useCallback((id: string, updated: RelayBlockConfigDetail) => {
        setConfigs(prev => prev.map(c => c.id === id ? updated : c));
    }, []);

    const handleConfigDelete = useCallback((id: string) => {
        setConfigs(prev => prev.filter(c => c.id !== id));
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={activeFilter === 'All' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter('All')}
                >
                    All
                </Button>
                {BLOCK_DEFS.map(block => (
                    <Button
                        key={block.component}
                        variant={activeFilter === block.component ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveFilter(block.component)}
                    >
                        {block.component}
                    </Button>
                ))}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Block Type Templates</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                    {filteredBlocks.map(block => {
                        const matchingConfigs = configsForBlock(block);
                        const count = matchingConfigs.length;

                        return (
                            <Card key={block.component}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{block.component}</CardTitle>
                                        <Badge variant="secondary">{count} config{count !== 1 ? 's' : ''}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {block.aliases.map(alias => (
                                            <Badge key={alias} variant="outline" className="text-xs">
                                                {alias}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {block.previews.map((preview, idx) => (
                                        <div key={idx}>
                                            {preview.label && (
                                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                                    {preview.label}
                                                </p>
                                            )}
                                            <div className="max-w-[360px] mx-auto bg-[#FAFAF6] rounded-2xl p-4 shadow-inner border border-gray-100">
                                                {preview.render()}
                                            </div>
                                        </div>
                                    ))}

                                    {count > 0 && (
                                        <>
                                            <Separator />
                                            <Collapsible>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="w-full justify-between">
                                                        <span>Show {count} config{count !== 1 ? 's' : ''}</span>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="space-y-2 pt-2">
                                                        {matchingConfigs.map(config => (
                                                            <div key={config.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                                                                <div className="min-w-0">
                                                                    <p className="font-medium truncate">{config.label}</p>
                                                                    {config.moduleSlug && (
                                                                        <p className="text-xs text-muted-foreground">Module: {config.moduleSlug}</p>
                                                                    )}
                                                                    {config.applicableIndustries.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {config.applicableIndustries.map(ind => (
                                                                                <Badge key={ind} variant="outline" className="text-xs py-0">
                                                                                    {ind}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Badge variant={config.status === 'active' ? 'default' : 'secondary'} className="text-xs shrink-0">
                                                                    {config.status}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Configured Blocks</h2>
                {configs.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Block Configs Yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Block configs are auto-generated when modules are created via /admin/modules/new
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
                        {configs.map(config => (
                            <ConfigCard
                                key={config.id}
                                config={config}
                                onUpdate={handleConfigUpdate}
                                onDelete={handleConfigDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface ConfigCardProps {
    config: RelayBlockConfigDetail;
    onUpdate: (id: string, updated: RelayBlockConfigDetail) => void;
    onDelete: (id: string) => void;
}

function ConfigCard({ config, onUpdate, onDelete }: ConfigCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState(config);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
                <Badge variant="outline" className="shrink-0">{config.blockType}</Badge>
                <span className="font-medium truncate">{config.label}</span>
                {config.moduleSlug && (
                    <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                        {config.moduleSlug}
                    </span>
                )}
                <span className="ml-auto shrink-0">
                    <Badge
                        variant={config.status === 'active' ? 'success' : 'secondary'}
                        className="text-xs"
                    >
                        {config.status}
                    </Badge>
                </span>
            </button>

            {isOpen && (
                <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-5" />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
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
                                    placeholder="{name} — {price} per night"
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

                            <div className="flex gap-2 pt-2">
                                <Button onClick={handleSave} disabled={saving} size="sm">
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {deleting ? 'Deleting...' : 'Delete Block'}
                                </Button>
                            </div>
                        </div>

                        <div>
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
