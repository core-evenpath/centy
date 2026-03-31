'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DEFAULT_THEME } from '@/components/relay/blocks';
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

interface BlockGalleryProps {
    configs: RelayBlockConfigDetail[];
}

export function BlockGallery({ configs: initialConfigs }: BlockGalleryProps) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [industryFilter, setIndustryFilter] = useState<string>('All');
    const [functionFilter, setFunctionFilter] = useState<string>('All');
    const [generatingAll, setGeneratingAll] = useState(false);
    const [clearingAll, setClearingAll] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
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
                                {/* Preview placeholder (replaced in Prompt 2B) */}
                                <div className="flex items-center justify-center h-[500px] border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <div className="text-center text-muted-foreground">
                                        <p className="font-medium">{selectedConfig.label}</p>
                                        <p className="text-sm">Phone preview coming soon</p>
                                        <Badge variant="secondary" className="mt-2">{selectedConfig.blockType}</Badge>
                                    </div>
                                </div>

                                {/* Edit panel placeholder (replaced in Prompt 2C) */}
                                <div className="text-sm text-muted-foreground text-center">Edit panel coming soon</div>
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
