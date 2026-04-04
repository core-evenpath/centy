'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_THEME } from '@/components/relay/blocks';
import type { CatalogItem, ActivityItem, ContactMethod, RelayBlock } from '@/components/relay/blocks';
import { BlockRenderer } from '@/components/relay/blocks';
import type { RelayBlockConfigDetail } from '@/actions/relay-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import Link from 'next/link';
import { INDUSTRIES, BUSINESS_FUNCTIONS } from '@/lib/business-taxonomy/industries';
import {
    ChevronDown,
    Zap,
    Plus,
    Save,
    Trash2,
    Loader2,
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
    'pricing', 'packages', 'plans',
    'testimonials', 'reviews',
    'quick_actions', 'menu_actions',
    'schedule', 'timetable', 'slots',
    'promo', 'offer', 'deal',
    'lead_capture', 'form', 'inquiry_form',
    'handoff', 'connect', 'human',
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
    pricing: 'bg-violet-100 text-violet-800',
    packages: 'bg-violet-100 text-violet-800',
    plans: 'bg-violet-100 text-violet-800',
    testimonials: 'bg-yellow-100 text-yellow-800',
    reviews: 'bg-yellow-100 text-yellow-800',
    quick_actions: 'bg-cyan-100 text-cyan-800',
    menu_actions: 'bg-cyan-100 text-cyan-800',
    schedule: 'bg-lime-100 text-lime-800',
    timetable: 'bg-lime-100 text-lime-800',
    slots: 'bg-lime-100 text-lime-800',
    promo: 'bg-rose-100 text-rose-800',
    offer: 'bg-rose-100 text-rose-800',
    deal: 'bg-rose-100 text-rose-800',
    lead_capture: 'bg-emerald-100 text-emerald-800',
    form: 'bg-emerald-100 text-emerald-800',
    inquiry_form: 'bg-emerald-100 text-emerald-800',
    handoff: 'bg-sky-100 text-sky-800',
    connect: 'bg-sky-100 text-sky-800',
    human: 'bg-sky-100 text-sky-800',
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
        case 'pricing':
        case 'packages':
        case 'plans':
            return {
                type: blockType,
                pricingTiers: [
                    { id: 'p1', name: 'Basic', price: 1500, currency: 'INR', unit: '/session', features: ['30 min session', 'Basic consultation'], emoji: '⭐' },
                    { id: 'p2', name: 'Standard', price: 3000, currency: 'INR', unit: '/session', features: ['60 min session', 'Full consultation', 'Follow-up call'], isPopular: true, emoji: '🌟', color: '#6366f1' },
                    { id: 'p3', name: 'Premium', price: 5000, currency: 'INR', unit: '/session', features: ['90 min session', 'Full consultation', 'Follow-up call', 'Priority booking', 'Reports'], emoji: '💎', color: '#8b5cf6' },
                ],
            };
        case 'testimonials':
        case 'reviews':
            return {
                type: blockType,
                testimonials: [
                    { id: 't1', name: 'Priya M.', text: 'Absolutely wonderful experience. The team was professional and attentive.', rating: 5, date: '1 week ago', source: 'Google' },
                    { id: 't2', name: 'Rahul K.', text: 'Great value for money. Will definitely come back again.', rating: 4, date: '2 weeks ago', source: 'WhatsApp' },
                    { id: 't3', name: 'Ananya S.', text: 'Best in the city. Highly recommend to everyone.', rating: 5, date: '3 days ago', source: 'Google' },
                ],
            };
        case 'quick_actions':
        case 'menu_actions':
            return {
                type: blockType,
                quickActions: [
                    { id: 'qa1', label: 'Browse Services', emoji: '🔍', prompt: 'Show me your services', description: 'See what we offer' },
                    { id: 'qa2', label: 'Check Prices', emoji: '💰', prompt: 'What are your prices?', description: 'View pricing plans' },
                    { id: 'qa3', label: 'Book Now', emoji: '📅', prompt: 'I want to book', description: 'Schedule a visit' },
                    { id: 'qa4', label: 'Get Directions', emoji: '📍', prompt: 'How do I get there?', description: 'Find our location' },
                ],
            };
        case 'schedule':
        case 'timetable':
        case 'slots':
            return {
                type: blockType,
                schedule: [
                    { id: 's1', time: '9:00 AM', endTime: '10:00 AM', title: 'Morning Flow', instructor: 'Coach Sarah', spots: 4, price: '₹500', emoji: '🧘', isAvailable: true },
                    { id: 's2', time: '10:30 AM', endTime: '11:30 AM', title: 'Power Training', instructor: 'Coach Mike', spots: 0, emoji: '💪', isAvailable: false },
                    { id: 's3', time: '12:00 PM', endTime: '1:00 PM', title: 'Lunch Yoga', instructor: 'Coach Sarah', spots: 8, price: '₹500', emoji: '🧘', isAvailable: true },
                    { id: 's4', time: '5:00 PM', endTime: '6:00 PM', title: 'Evening HIIT', instructor: 'Coach Raj', spots: 2, price: '₹700', emoji: '🔥', isAvailable: true },
                ],
            };
        case 'promo':
        case 'offer':
        case 'deal':
            return {
                type: blockType,
                promos: [
                    { id: 'pr1', title: 'Weekend Special', description: 'Premium service at regular price this weekend', discount: '25% OFF', code: 'WEEKEND25', validUntil: 'Valid until Sunday', emoji: '🎉', color: '#ef4444', colorEnd: '#f97316', ctaLabel: 'Claim Offer' },
                ],
            };
        case 'lead_capture':
        case 'form':
        case 'inquiry_form':
            return {
                type: blockType,
                fields: [
                    { id: 'f1', label: 'Your Name', type: 'text', placeholder: 'Enter your name', required: true },
                    { id: 'f2', label: 'Phone Number', type: 'phone', placeholder: '+91 98765 43210', required: true },
                    { id: 'f3', label: 'Email', type: 'email', placeholder: 'you@example.com', required: false },
                    { id: 'f4', label: 'Interested In', type: 'select', options: ['General Inquiry', 'Price Quote', 'Book Appointment', 'Other'], required: true },
                ],
            };
        case 'handoff':
        case 'connect':
        case 'human':
            return {
                type: blockType,
                handoffOptions: [
                    { id: 'h1', type: 'whatsapp', label: 'WhatsApp Us', value: '+91 98765 43210', icon: '💬', description: 'Usually replies within 5 min' },
                    { id: 'h2', type: 'phone', label: 'Call Now', value: '+91 98765 43210', icon: '📞', description: 'Available 9 AM - 6 PM' },
                    { id: 'h3', type: 'callback', label: 'Request Callback', icon: '🔔', description: "We'll call you back" },
                ],
            };
        default:
            return { type: 'text', text: 'Welcome! How can I help you today?', suggestions: ['Learn more', 'Contact us'] };
    }
}

function sampleDataToRelayBlock(blockType: string, sampleData: Record<string, any>): RelayBlock | null {
    if (!sampleData || Object.keys(sampleData).length === 0) {
        return null;
    }

    const block: RelayBlock = { type: blockType, ...sampleData };

    if (['handoff', 'connect', 'human'].includes(blockType) && sampleData.options && !sampleData.handoffOptions) {
        block.handoffOptions = sampleData.options;
    }

    return block;
}

function getBlockTypeColor(blockType: string): string {
    return BLOCK_TYPE_COLORS[blockType] || 'bg-gray-100 text-gray-800';
}

function buildBlockFromConfig(config: RelayBlockConfigDetail): RelayBlock {
    const sampleData = config.blockTypeTemplate?.sampleData;
    if (sampleData && typeof sampleData === 'object' && Object.keys(sampleData).length > 0) {
        return { type: config.blockType, ...sampleData } as RelayBlock;
    }
    return generateMockBlock(config.blockType);
}

function getUserMessage(blockType: string, label: string): string {
    const m: Record<string, string> = {
        catalog: `What ${label.toLowerCase()} do you have?`,
        services: 'What services do you offer?',
        products: 'Show me your products',
        menu: 'Can I see the menu?',
        rooms: 'What rooms are available?',
        listings: 'Show me available listings',
        pricing: 'What are your pricing plans?',
        packages: 'What packages do you offer?',
        activities: 'What activities can I do?',
        experiences: 'What experiences do you offer?',
        classes: 'What classes are available?',
        treatments: 'What treatments do you have?',
        book: "I'd like to book something",
        reserve: 'Can I make a reservation?',
        appointment: 'I need to schedule an appointment',
        inquiry: 'I have a question about your services',
        testimonials: 'What do your clients say?',
        reviews: 'Can I see reviews?',
        compare: 'Can you compare options for me?',
        schedule: "What's available today?",
        promo: 'Any current offers?',
        location: 'Where are you located?',
        directions: 'How do I get there?',
        contact: 'How can I reach you?',
        gallery: 'Can I see photos?',
        photos: 'Show me some photos',
        info: 'Tell me more',
        faq: 'I have a question',
        details: 'Can I get more details?',
        greeting: 'Hi!',
        welcome: 'Hello!',
    };
    return m[blockType] || `Tell me about ${label.toLowerCase()}`;
}

function getSuggestions(blockType: string): string[] {
    const s: Record<string, string[]> = {
        catalog: ['Compare options', 'Book now', 'See pricing'],
        services: ['Book a consultation', 'See pricing'],
        products: ['Add to cart', 'Compare'],
        menu: ['Order now', 'See specials'],
        rooms: ['Check availability', 'See amenities'],
        listings: ['View details', 'Contact agent'],
        activities: ['Book now', 'See schedule'],
        experiences: ['Book experience', 'See details'],
        classes: ['Enroll now', 'See schedule'],
        treatments: ['Book treatment', 'See pricing'],
        book: ['Check availability', 'Contact us'],
        reserve: ['Pick a date', 'Contact us'],
        appointment: ['See available slots', 'Call us'],
        compare: ['Book now', 'Learn more'],
        location: ['Get directions', 'Contact us'],
        contact: ['Send a message', 'Call now'],
        gallery: ['Learn more', 'Book now'],
        info: ['Contact us', 'Book now'],
        faq: ['Ask another question', 'Contact us'],
        greeting: ['Browse services', 'See pricing', 'Contact us'],
        welcome: ['Browse services', 'See pricing'],
    };
    return s[blockType] || ['Learn more', 'Contact us'];
}

const PREVIEW_THEME = {
    accent: '#c2410c',
    bg: '#faf8f5',
    surface: '#ffffff',
    t1: '#1c1917',
    t2: '#44403c',
    t3: '#78716c',
    t4: '#a8a29e',
    bdrL: '#e7e5e4',
};

interface BlockGalleryProps {
    configs: RelayBlockConfigDetail[];
}

export function BlockGallery({ configs: initialConfigs }: BlockGalleryProps) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [industryFilter, setIndustryFilter] = useState<string>('All');
    const [functionFilter, setFunctionFilter] = useState<string>('All');
    const [selectedId, setSelectedId] = useState<string | null>(initialConfigs[0]?.id ?? null);

    const selectedConfig = useMemo(() => configs.find(c => c.id === selectedId) ?? null, [configs, selectedId]);

    const uniqueBlockTypes = useMemo(() => {
        const types = new Set(configs.map(c => c.blockType));
        return Array.from(types).sort();
    }, [configs]);

    const availableFunctions = useMemo(() => {
        if (industryFilter === 'All') return [];
        return BUSINESS_FUNCTIONS.filter(bf => bf.industryId === industryFilter);
    }, [industryFilter]);

    const filteredConfigs = useMemo(() => {
        let result = configs;
        if (activeFilter !== 'All') {
            result = result.filter(c => c.blockType === activeFilter);
        }
        if (industryFilter !== 'All') {
            result = result.filter(c => c.applicableIndustries?.includes(industryFilter));
        }
        if (functionFilter !== 'All') {
            result = result.filter(c => c.applicableFunctions?.includes(functionFilter));
        }
        return result;
    }, [configs, activeFilter, industryFilter, functionFilter]);

    const blockTypeDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        configs.forEach(c => { counts[c.blockType] = (counts[c.blockType] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [configs]);

    const handleConfigUpdate = useCallback((id: string, updated: RelayBlockConfigDetail) => {
        setConfigs(prev => prev.map(c => c.id === id ? updated : c));
    }, []);

    const handleConfigDelete = useCallback((id: string) => {
        setConfigs(prev => prev.filter(c => c.id !== id));
    }, []);

    return (
        <div className="space-y-6">
            {blockTypeDistribution.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {blockTypeDistribution.map(([type, count]) => (
                        <Badge key={type} variant="secondary" className={`text-xs ${getBlockTypeColor(type)}`}>
                            {type} ({count})
                        </Badge>
                    ))}
                </div>
            )}

            <div className="flex gap-3 mb-4">
                <Select value={industryFilter} onValueChange={(v) => { setIndustryFilter(v); setFunctionFilter('All'); }}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Industries</SelectItem>
                        {INDUSTRIES.map(ind => (
                            <SelectItem key={ind.industryId} value={ind.industryId}>{ind.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {industryFilter !== 'All' && (
                    <Select value={functionFilter} onValueChange={setFunctionFilter}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="All Sub-Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Sub-Categories</SelectItem>
                            {availableFunctions.map(bf => (
                                <SelectItem key={bf.functionId} value={bf.functionId}>{bf.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

            {configs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Block Configs Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Block configs are auto-generated when modules are created, or use &quot;Generate All Missing&quot; above.
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: scrollable block list */}
                    <div className="lg:col-span-1 space-y-2 max-h-[75vh] overflow-y-auto pr-2">
                        {filteredConfigs.map(config => (
                            <BlockListItem
                                key={config.id}
                                config={config}
                                selected={config.id === selectedId}
                                onClick={() => setSelectedId(config.id)}
                            />
                        ))}
                    </div>

                    {/* RIGHT: preview + edit area */}
                    <div className="lg:col-span-2">
                        {selectedConfig ? (
                            <div className="space-y-6">
                                <PhonePreview config={selectedConfig} />

                                <EditPanel
                                    config={selectedConfig}
                                    onUpdate={handleConfigUpdate}
                                    onDelete={(id) => {
                                        handleConfigDelete(id);
                                        setSelectedId(filteredConfigs.find(c => c.id !== id)?.id ?? null);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                                Select a block to preview
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function PhonePreview({ config }: { config: RelayBlockConfigDetail }) {
    const block = useMemo(() => buildBlockFromConfig(config), [config]);
    const userMsg = getUserMessage(config.blockType, config.label);
    const suggestions = getSuggestions(config.blockType);

    return (
        <div className="flex justify-center">
            <div style={{
                width: '375px', height: '667px',
                border: '6px solid #1c1917', borderRadius: '32px',
                background: PREVIEW_THEME.bg, overflow: 'hidden',
                display: 'flex', flexDirection: 'column', position: 'relative',
            }}>
                {/* Notch */}
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '110px', height: '24px', background: '#1c1917',
                    borderRadius: '0 0 14px 14px', zIndex: 10,
                }} />

                {/* Header */}
                <div style={{
                    padding: '36px 16px 10px', background: PREVIEW_THEME.surface,
                    borderBottom: `1px solid ${PREVIEW_THEME.bdrL}`,
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '9999px',
                        background: PREVIEW_THEME.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '14px',
                    }}>⚡</div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: PREVIEW_THEME.t1 }}>{config.label}</div>
                        <div style={{ fontSize: '11px', color: PREVIEW_THEME.t3 }}>{config.blockType}</div>
                    </div>
                </div>

                {/* Chat area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* User bubble */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{
                            background: PREVIEW_THEME.accent, color: '#fff',
                            padding: '8px 14px', borderRadius: '16px 16px 4px 16px',
                            fontSize: '13px', maxWidth: '80%',
                        }}>{userMsg}</div>
                    </div>

                    {/* Bot response */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '9999px',
                            background: PREVIEW_THEME.accent, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '12px',
                        }}>⚡</div>
                        <div style={{
                            background: PREVIEW_THEME.surface,
                            border: `1px solid ${PREVIEW_THEME.bdrL}`,
                            borderRadius: '4px 16px 16px 16px',
                            padding: '10px', maxWidth: 'calc(100% - 40px)', overflow: 'hidden',
                        }}>
                            <BlockRenderer block={block} theme={DEFAULT_THEME} />
                        </div>
                    </div>

                    {/* Suggestion chips */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '36px' }}>
                        {suggestions.map((s, i) => (
                            <div key={i} style={{
                                padding: '5px 12px', borderRadius: '9999px', fontSize: '12px',
                                border: `1px solid ${PREVIEW_THEME.bdrL}`, color: PREVIEW_THEME.t2,
                                background: PREVIEW_THEME.surface, cursor: 'default',
                            }}>{s}</div>
                        ))}
                    </div>
                </div>

                {/* Input bar */}
                <div style={{
                    padding: '10px 16px', background: PREVIEW_THEME.surface,
                    borderTop: `1px solid ${PREVIEW_THEME.bdrL}`,
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <div style={{
                        flex: 1, padding: '8px 12px', borderRadius: '9999px',
                        background: PREVIEW_THEME.bg, fontSize: '12px', color: PREVIEW_THEME.t4,
                        border: `1px solid ${PREVIEW_THEME.bdrL}`,
                    }}>Ask about {config.label.toLowerCase()}...</div>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '9999px',
                        background: PREVIEW_THEME.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '14px',
                    }}>↑</div>
                </div>
            </div>
        </div>
    );
}

function EditPanel({ config, onUpdate, onDelete }: {
    config: RelayBlockConfigDetail;
    onUpdate: (id: string, updated: RelayBlockConfigDetail) => void;
    onDelete: (id: string) => void;
}) {
    const [draft, setDraft] = useState(config);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setDraft(config);
        setIsOpen(false);
    }, [config.id]);

    const updateDraft = useCallback(<K extends keyof RelayBlockConfigDetail>(key: K, value: RelayBlockConfigDetail[K]) => {
        setDraft(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateDataSchema = useCallback((key: string, value: string | number | string[]) => {
        setDraft(prev => ({ ...prev, dataSchema: { ...prev.dataSchema, [key]: value } }));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        toast.error('Block configs are now defined in code — edit @/lib/relay/blocks/ instead');
        setSaving(false);
    };

    const handleDelete = async () => {
        toast.error('Block configs are now defined in code — remove from @/lib/relay/blocks/ instead');
    };

    return (
        <Card>
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Edit Configuration</span>
                    <Badge variant="secondary" className="text-xs">{config.blockType}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <CardContent className="pt-0 space-y-4">
                    <Separator />

                    {config.blockTypeTemplate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span>Generated by: {config.blockTypeTemplate.generatedBy}</span>
                            {config.blockTypeTemplate.generatedAt && (
                                <span>| {new Date(config.blockTypeTemplate.generatedAt).toLocaleDateString()}</span>
                            )}
                            {config.blockTypeTemplate.subcategory && (
                                <span>| {config.blockTypeTemplate.subcategory}</span>
                            )}
                            {config.blockTypeTemplate.isDefault && (
                                <Badge variant="outline" className="text-xs py-0">fallback</Badge>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Block Type</Label>
                            <Select value={draft.blockType} onValueChange={v => updateDraft('blockType', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {BLOCK_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Label</Label>
                            <Input className="mt-1" value={draft.label} onChange={e => updateDraft('label', e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <Label>Description</Label>
                        <Textarea className="mt-1" rows={2} value={draft.description || ''} onChange={e => updateDraft('description', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Source Collection</Label>
                            <Input className="mt-1" value={draft.dataSchema?.sourceCollection || ''} onChange={e => updateDataSchema('sourceCollection', e.target.value)} />
                        </div>
                        <div>
                            <Label>Max Items</Label>
                            <Input className="mt-1" type="number" value={draft.dataSchema?.maxItems || 5} onChange={e => updateDataSchema('maxItems', parseInt(e.target.value) || 5)} />
                        </div>
                        <div>
                            <Label>Sort By</Label>
                            <Input className="mt-1" value={draft.dataSchema?.sortBy || 'createdAt'} onChange={e => updateDataSchema('sortBy', e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                            <Trash2 className="w-3 h-3 mr-1" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                            <Save className="w-3 h-3 mr-1" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function BlockListItem({ config, selected, onClick }: {
    config: RelayBlockConfigDetail;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <div
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selected ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{config.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{config.moduleSlug}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">{config.blockType}</Badge>
                    <span className={`w-2 h-2 rounded-full ${config.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
            </div>
            {config.applicableFunctions?.[0] && (
                <div className="text-xs text-muted-foreground mt-1 truncate">{config.applicableFunctions[0]}</div>
            )}
        </div>
    );
}
