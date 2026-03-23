'use client';

import React, { useState, useMemo } from 'react';
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
import type { CatalogItem, ActivityItem, ContactMethod } from '@/components/relay/blocks';
import type { RelayBlockConfigDetail } from '@/actions/relay-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import Link from 'next/link';
import { ChevronDown, Zap, Plus } from 'lucide-react';

// ── Sample Data ─────────────────────────────────────────────────────

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

// ── Block Definitions ───────────────────────────────────────────────

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
                    location={{
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
                    }}
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
                    items={[
                        { emoji: '🏊', label: 'Infinity Pool', span: 2 },
                        { emoji: '🍽️', label: 'Restaurant' },
                        { emoji: '🛏️', label: 'Suite' },
                        { emoji: '🧖', label: 'Spa', span: 2 },
                        { emoji: '🌅', label: 'Beach' },
                    ]}
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
                    items={[
                        { label: 'Check-in', value: '2:00 PM' },
                        { label: 'Check-out', value: '11:00 AM' },
                        { label: 'WiFi', value: 'Free — all areas' },
                        { label: 'Parking', value: 'Valet — ₹500/day' },
                        { label: 'Pool Hours', value: '6 AM – 10 PM' },
                        { label: 'Pets', value: 'Not allowed' },
                    ]}
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
                    quickActions={[
                        { icon: '🛏️', label: 'Browse rooms', prompt: 'Show me available rooms' },
                        { icon: '🍽️', label: 'See menu', prompt: "What's on the menu?" },
                        { icon: '💆', label: 'Spa services', prompt: 'Tell me about spa treatments' },
                        { icon: '📍', label: 'Directions', prompt: 'How do I get there?' },
                    ]}
                    theme={DEFAULT_THEME}
                />
            ),
        }],
    },
];

// ── Helper: get all type aliases that map to a component ────────────

function getAliasesForComponent(componentName: string): string[] {
    const def = BLOCK_DEFS.find(d => d.component === componentName);
    return def?.aliases ?? [];
}

function configMatchesBlock(config: RelayBlockConfigDetail, block: BlockDef): boolean {
    return block.aliases.some(alias => alias === config.blockType);
}

// ── Component ───────────────────────────────────────────────────────

interface BlockGalleryProps {
    configs: RelayBlockConfigDetail[];
}

export function BlockGallery({ configs }: BlockGalleryProps) {
    const [activeFilter, setActiveFilter] = useState<string>('All');

    const filteredBlocks = useMemo(() => {
        if (activeFilter === 'All') return BLOCK_DEFS;
        return BLOCK_DEFS.filter(b => b.component === activeFilter);
    }, [activeFilter]);

    const configCountForBlock = (block: BlockDef): number => {
        return configs.filter(c => configMatchesBlock(c, block)).length;
    };

    const configsForBlock = (block: BlockDef): RelayBlockConfigDetail[] => {
        return configs.filter(c => configMatchesBlock(c, block));
    };

    return (
        <div className="space-y-8">
            {/* ── Filter Bar ──────────────────────────────────── */}
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

            {/* ── Section A: Block Type Templates ─────────────── */}
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

                                    {/* Collapsible config panel */}
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

            {/* ── Section B: Configured Blocks ────────────────── */}
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
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-3 font-medium">Label</th>
                                            <th className="text-left p-3 font-medium">Block Type</th>
                                            <th className="text-left p-3 font-medium">Module</th>
                                            <th className="text-left p-3 font-medium">Industries</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Template</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {configs.map(config => {
                                            const matchingBlock = BLOCK_DEFS.find(b => configMatchesBlock(config, b));
                                            return (
                                                <tr key={config.id} className="border-b last:border-0">
                                                    <td className="p-3 font-medium">{config.label}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline">{config.blockType}</Badge>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {config.moduleSlug || '—'}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {config.applicableIndustries.length > 0
                                                                ? config.applicableIndustries.map(ind => (
                                                                    <Badge key={ind} variant="outline" className="text-xs py-0">
                                                                        {ind}
                                                                    </Badge>
                                                                ))
                                                                : <span className="text-muted-foreground">—</span>
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            config.status === 'active'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {config.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {matchingBlock?.component || 'TextWithSuggestions'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
