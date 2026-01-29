'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
    getBusinessPersonaAction,
    updateCoreVisibilityAction
} from '@/actions/business-persona-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    ArrowLeft,
    Brain,
    Building2,
    Phone,
    Mail,
    MapPin,
    MessageSquare,
    Package,
    Users,
    Globe,
    FileText,
    RefreshCw,
    Eye,
    EyeOff,
    Sparkles,
    CheckCircle2,
    Clock,
    DollarSign,
    ShieldCheck,
    Boxes,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FieldConfig {
    key: string;
    label: string;
    icon: React.ElementType;
}

interface SectionConfig {
    key: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    fields: FieldConfig[];
}

const SECTIONS_CONFIG: SectionConfig[] = [
    {
        key: 'identity',
        label: 'Business Identity',
        description: 'Core business information, contact details, and location',
        icon: Building2,
        color: 'blue',
        fields: [
            { key: 'identity.name', label: 'Business Name', icon: Building2 },
            { key: 'identity.phone', label: 'Phone Number', icon: Phone },
            { key: 'identity.email', label: 'Email Address', icon: Mail },
            { key: 'identity.website', label: 'Website', icon: Globe },
            { key: 'identity.whatsAppNumber', label: 'WhatsApp Number', icon: Phone },
            { key: 'identity.address', label: 'Address & Location', icon: MapPin },
            { key: 'identity.operatingHours', label: 'Operating Hours', icon: Clock },
            { key: 'identity.socialMedia', label: 'Social Media Links', icon: Users },
            { key: 'identity.industry', label: 'Industry & Category', icon: Boxes },
            { key: 'identity.currency', label: 'Currency', icon: DollarSign },
            { key: 'identity.timezone', label: 'Timezone', icon: Clock },
        ]
    },
    {
        key: 'personality',
        label: 'Brand & Voice',
        description: 'How your business communicates and presents itself',
        icon: MessageSquare,
        color: 'purple',
        fields: [
            { key: 'personality.tagline', label: 'Tagline', icon: Sparkles },
            { key: 'personality.description', label: 'Business Description', icon: FileText },
            { key: 'personality.voiceTone', label: 'Voice Tone', icon: MessageSquare },
            { key: 'personality.communicationStyle', label: 'Communication Style', icon: MessageSquare },
            { key: 'personality.uniqueSellingPoints', label: 'Unique Selling Points', icon: Sparkles },
            { key: 'personality.brandValues', label: 'Brand Values', icon: ShieldCheck },
            { key: 'personality.languagePreference', label: 'Language Preference', icon: Globe },
            { key: 'personality.foundedYear', label: 'Founded Year', icon: Clock },
        ]
    },
    {
        key: 'knowledge',
        label: 'Products & Services',
        description: 'What you offer, pricing, and business policies',
        icon: Package,
        color: 'emerald',
        fields: [
            { key: 'knowledge.productsOrServices', label: 'Products/Services List', icon: Package },
            { key: 'knowledge.serviceCategories', label: 'Service Categories', icon: Boxes },
            { key: 'knowledge.pricingModel', label: 'Pricing Model', icon: DollarSign },
            { key: 'knowledge.pricingHighlights', label: 'Pricing Highlights', icon: DollarSign },
            { key: 'knowledge.acceptedPayments', label: 'Accepted Payments', icon: DollarSign },
            { key: 'knowledge.faqs', label: 'FAQs', icon: MessageSquare },
            { key: 'knowledge.policies', label: 'Business Policies', icon: ShieldCheck },
            { key: 'knowledge.currentOffers', label: 'Current Offers', icon: Sparkles },
        ]
    },
    {
        key: 'customerProfile',
        label: 'Customer Profile',
        description: 'Target audience and customer insights',
        icon: Users,
        color: 'amber',
        fields: [
            { key: 'customerProfile.targetAudience', label: 'Target Audience', icon: Users },
            { key: 'customerProfile.customerDemographics', label: 'Customer Demographics', icon: Users },
            { key: 'customerProfile.customerPainPoints', label: 'Pain Points', icon: AlertCircle },
            { key: 'customerProfile.commonQueries', label: 'Common Queries', icon: MessageSquare },
            { key: 'customerProfile.peakContactTimes', label: 'Peak Contact Times', icon: Clock },
        ]
    },
    {
        key: 'industrySpecificData',
        label: 'Industry Data',
        description: 'Specialized fields for your business type',
        icon: Boxes,
        color: 'rose',
        fields: []
    },
    {
        key: 'otherUsefulData',
        label: 'Other Data',
        description: 'Additional context from imports and manual entries',
        icon: FileText,
        color: 'slate',
        fields: []
    }
];

const COLOR_CLASSES: Record<string, { bg: string, text: string, border: string, light: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-50' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', light: 'bg-purple-50' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-50' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', light: 'bg-rose-50' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', light: 'bg-slate-50' },
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
};

function OperatingHoursDisplay({ hours }: { hours: any }) {
    if (!hours) return <span className="text-slate-400 italic">Not set</span>;

    if (hours.isOpen24x7) {
        return <Badge className="bg-green-100 text-green-700">Open 24/7</Badge>;
    }

    if (hours.appointmentOnly) {
        return <Badge className="bg-purple-100 text-purple-700">By Appointment Only</Badge>;
    }

    if (hours.specialNote && !hours.schedule) {
        return <span className="text-slate-700">{hours.specialNote}</span>;
    }

    if (hours.schedule) {
        return (
            <div className="space-y-1 w-full">
                <div className="grid grid-cols-7 gap-1 text-xs">
                    {DAY_ORDER.map(day => {
                        const sched = hours.schedule[day];
                        const isOpen = sched?.isOpen || (sched?.openTime && sched?.closeTime) || (sched?.open && sched?.close);
                        const openTime = sched?.openTime || sched?.open;
                        const closeTime = sched?.closeTime || sched?.close;

                        return (
                            <div key={day} className={cn(
                                "p-2 rounded text-center",
                                isOpen ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"
                            )}>
                                <div className="font-medium text-slate-600">{DAY_LABELS[day]}</div>
                                {isOpen ? (
                                    <div className="text-green-700 text-[10px] mt-1">
                                        {openTime}<br />{closeTime}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-[10px] mt-1">Closed</div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {hours.specialNote && (
                    <p className="text-xs text-slate-500 mt-2 italic">{hours.specialNote}</p>
                )}
            </div>
        );
    }

    return <span className="text-slate-400 italic">Not configured</span>;
}

function AddressDisplay({ address }: { address: any }) {
    if (!address) return <span className="text-slate-400 italic">Not set</span>;
    if (typeof address === 'string') return <span>{address}</span>;

    const parts = [
        address.street,
        address.area,
        address.city,
        address.state,
        address.postalCode || address.pincode,
        address.country
    ].filter(Boolean);

    if (parts.length === 0) return <span className="text-slate-400 italic">Not set</span>;

    return <span>{parts.join(', ')}</span>;
}

function SocialMediaDisplay({ social }: { social: any }) {
    if (!social || typeof social !== 'object') return <span className="text-slate-400 italic">Not set</span>;

    const platforms = Object.entries(social).filter(([_, value]) => value && value !== '');

    if (platforms.length === 0) return <span className="text-slate-400 italic">Not set</span>;

    return (
        <div className="flex flex-wrap gap-2">
            {platforms.map(([platform, url]) => (
                <a
                    key={platform}
                    href={String(url).startsWith('http') ? String(url) : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs text-slate-700 transition-colors"
                >
                    <span className="capitalize font-medium">{platform}</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            ))}
        </div>
    );
}

function IndustryDisplay({ industry }: { industry: any }) {
    if (!industry) return <span className="text-slate-400 italic">Not set</span>;
    if (typeof industry === 'string') return <span>{industry}</span>;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {industry.category && (
                <Badge variant="secondary" className="capitalize">
                    {String(industry.category).replace(/_/g, ' ')}
                </Badge>
            )}
            {industry.name && industry.name !== industry.category && (
                <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <span>{industry.name}</span>
                </>
            )}
        </div>
    );
}

function ProductsDisplay({ products }: { products: any[] }) {
    if (!products || !Array.isArray(products) || products.length === 0) {
        return <span className="text-slate-400 italic">Not set</span>;
    }

    return (
        <div className="space-y-2 w-full">
            {products.map((product, idx) => {
                const name = typeof product === 'string' ? product : product.name;
                const price = typeof product === 'object' ? (product.priceRange || product.price) : null;
                const desc = typeof product === 'object' ? product.description : null;

                return (
                    <div key={idx} className="flex items-start justify-between p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="flex-1">
                            <span className="font-medium text-slate-700">{name || `Item ${idx + 1}`}</span>
                            {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
                        </div>
                        {price && <Badge variant="outline" className="text-xs ml-2 shrink-0">{price}</Badge>}
                    </div>
                );
            })}
        </div>
    );
}

function FAQsDisplay({ faqs }: { faqs: any[] }) {
    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
        return <span className="text-slate-400 italic">Not set</span>;
    }

    return (
        <div className="space-y-2 w-full">
            {faqs.map((faq, idx) => (
                <Collapsible key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 text-sm flex-1">
                            {faq.question || faq.q || `FAQ ${idx + 1}`}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 text-sm text-slate-600 bg-white border-t border-slate-100">
                        {faq.answer || faq.a || 'No answer provided'}
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    );
}

function PoliciesDisplay({ policies }: { policies: any }) {
    if (!policies || typeof policies !== 'object') return <span className="text-slate-400 italic">Not set</span>;

    const entries = Object.entries(policies).filter(([_, value]) => value !== undefined && value !== null && value !== '');

    if (entries.length === 0) return <span className="text-slate-400 italic">Not set</span>;

    return (
        <div className="flex flex-wrap gap-2">
            {entries.map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();

                if (typeof value === 'boolean') {
                    return (
                        <Badge
                            key={key}
                            variant={value ? "default" : "outline"}
                            className={cn("text-xs", value ? "bg-green-100 text-green-700" : "text-slate-400")}
                        >
                            {value ? '✓' : '✗'} {label}
                        </Badge>
                    );
                }

                return (
                    <Badge key={key} variant="secondary" className="text-xs">
                        {label}: {String(value)}
                    </Badge>
                );
            })}
        </div>
    );
}

function ArrayDisplay({ items }: { items: any[] }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return <span className="text-slate-400 italic">Not set</span>;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((item, idx) => {
                const text = typeof item === 'string' ? item : (item.name || item.label || item.value || JSON.stringify(item));
                return (
                    <Badge key={idx} variant="secondary" className="text-xs">
                        {text}
                    </Badge>
                );
            })}
        </div>
    );
}

function ObjectDisplay({ obj }: { obj: any }) {
    if (!obj || typeof obj !== 'object') return <span className="text-slate-400 italic">Not set</span>;

    const entries = Object.entries(obj).filter(([k, v]) => v !== undefined && v !== null && v !== '' && k !== 'id');

    if (entries.length === 0) return <span className="text-slate-400 italic">Not set</span>;

    return (
        <div className="space-y-1">
            {entries.map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase()).trim();
                let displayVal: React.ReactNode;

                if (Array.isArray(value)) {
                    displayVal = value.length > 0 ? <ArrayDisplay items={value} /> : <span className="text-slate-400">Empty</span>;
                } else if (typeof value === 'object') {
                    displayVal = <span className="text-slate-600">{JSON.stringify(value)}</span>;
                } else if (typeof value === 'boolean') {
                    displayVal = <Badge variant={value ? "default" : "outline"} className="text-xs">{value ? 'Yes' : 'No'}</Badge>;
                } else {
                    displayVal = <span className="text-slate-700">{String(value)}</span>;
                }

                return (
                    <div key={key} className="flex items-start gap-2 text-sm">
                        <span className="text-slate-500 min-w-[100px] shrink-0">{label}:</span>
                        <div className="flex-1">{displayVal}</div>
                    </div>
                );
            })}
        </div>
    );
}

function FieldValueDisplay({ path, value }: { path: string; value: any }) {
    if (value === undefined || value === null || value === '') {
        return <span className="text-slate-400 italic">Not set</span>;
    }

    if (path.includes('operatingHours')) {
        return <OperatingHoursDisplay hours={value} />;
    }

    if (path.includes('.address') && typeof value === 'object') {
        return <AddressDisplay address={value} />;
    }

    if (path.includes('socialMedia')) {
        return <SocialMediaDisplay social={value} />;
    }

    if (path.includes('.industry')) {
        return <IndustryDisplay industry={value} />;
    }

    if (path.includes('productsOrServices')) {
        return <ProductsDisplay products={value} />;
    }

    if (path.includes('faqs')) {
        return <FAQsDisplay faqs={value} />;
    }

    if (path.includes('policies')) {
        return <PoliciesDisplay policies={value} />;
    }

    if (Array.isArray(value)) {
        return <ArrayDisplay items={value} />;
    }

    if (typeof value === 'object') {
        if (value.city || value.street) return <AddressDisplay address={value} />;
        if (value.name && Object.keys(value).length <= 3) return <span>{value.name}</span>;
        return <ObjectDisplay obj={value} />;
    }

    if (typeof value === 'string') {
        if (value.length > 300) {
            return (
                <Collapsible>
                    <div className="text-slate-700">{value.substring(0, 300)}...</div>
                    <CollapsibleTrigger className="text-xs text-blue-600 hover:underline mt-1">
                        Show full text
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="text-slate-700 mt-2 whitespace-pre-wrap">{value}</div>
                    </CollapsibleContent>
                </Collapsible>
            );
        }
        return <span className="text-slate-700">{value}</span>;
    }

    if (typeof value === 'boolean') {
        return <Badge variant={value ? "default" : "outline"}>{value ? 'Yes' : 'No'}</Badge>;
    }

    return <span className="text-slate-700">{String(value)}</span>;
}

export default function CoreDataPage() {
    const { user, loading: authLoading } = useAuth();
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [persona, setPersona] = useState<any>(null);
    const [visibilityState, setVisibilityState] = useState<{
        sections: Record<string, boolean>;
        fields: Record<string, boolean>;
    }>({
        sections: {},
        fields: {}
    });

    const partnerId = user?.customClaims?.partnerId;

    const fetchData = async () => {
        if (!partnerId) return;
        setLoading(true);

        try {
            const personaResult = await getBusinessPersonaAction(partnerId);

            console.log('[CoreData] Fetched persona:', personaResult.persona);

            if (personaResult.success && personaResult.persona) {
                setPersona(personaResult.persona);
                const cv = personaResult.persona.coreVisibility || { sections: {}, fields: {} };
                setVisibilityState({
                    sections: {
                        identity: true,
                        personality: true,
                        knowledge: true,
                        customerProfile: true,
                        webIntelligence: true,
                        industrySpecificData: true,
                        otherUsefulData: true,
                        ...cv.sections
                    },
                    fields: { ...cv.fields }
                });
            }
        } catch (err) {
            console.error('Error:', err);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && partnerId) fetchData();
    }, [partnerId, authLoading]);

    const handleSectionToggle = (sectionKey: string) => {
        const newValue = !visibilityState.sections[sectionKey];
        const newSections = { ...visibilityState.sections, [sectionKey]: newValue };

        setVisibilityState(prev => ({ ...prev, sections: newSections }));

        startTransition(async () => {
            const result = await updateCoreVisibilityAction(partnerId!, {
                sections: newSections,
                fields: visibilityState.fields,
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: 'user'
            });

            if (result.success) {
                toast.success(`${SECTIONS_CONFIG.find(s => s.key === sectionKey)?.label} ${newValue ? 'visible' : 'hidden'}`);
            } else {
                toast.error('Failed to update');
                setVisibilityState(prev => ({ ...prev, sections: { ...prev.sections, [sectionKey]: !newValue } }));
            }
        });
    };

    const handleFieldToggle = (fieldKey: string) => {
        const currentValue = visibilityState.fields[fieldKey] ?? true;
        const newValue = !currentValue;
        const newFields = { ...visibilityState.fields, [fieldKey]: newValue };

        setVisibilityState(prev => ({ ...prev, fields: newFields }));

        startTransition(async () => {
            const result = await updateCoreVisibilityAction(partnerId!, {
                sections: visibilityState.sections,
                fields: newFields,
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: 'user'
            });

            if (!result.success) {
                toast.error('Failed to update');
                setVisibilityState(prev => ({ ...prev, fields: { ...prev.fields, [fieldKey]: currentValue } }));
            }
        });
    };

    const getFieldValue = (path: string): any => {
        if (!persona) return undefined;
        const parts = path.split('.');
        let value: any = persona;
        for (const part of parts) {
            value = value?.[part];
        }
        return value;
    };

    const hasFieldValue = (path: string): boolean => {
        const value = getFieldValue(path);
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === 'object' && !Array.isArray(value)) {
            return Object.values(value).some(v => v !== undefined && v !== null && v !== '');
        }
        return true;
    };

    if (authLoading || loading) {
        return (
            <div className="p-8 space-y-4 max-w-4xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    const enabledCount = Object.values(visibilityState.sections).filter(Boolean).length;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div className="mb-4">
                <Link href="/partner/settings" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Settings
                </Link>
            </div>

            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-xl">
                        <Brain className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Core Data Access</h1>
                        <p className="text-slate-500 text-sm">View and control what your AI can access</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm">
                        {enabledCount}/7 sections
                    </Badge>
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isPending}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isPending && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800">
                    <strong>All data synced from Business Profile.</strong> Changes made in{' '}
                    <Link href="/partner/settings" className="underline">Settings</Link>{' '}
                    appear here. Toggle visibility to control AI access.
                </p>
            </div>

            <div className="space-y-6">
                {SECTIONS_CONFIG.map((section) => {
                    const isSectionEnabled = visibilityState.sections[section.key] !== false;
                    const Icon = section.icon;
                    const colors = COLOR_CLASSES[section.color];

                    let dynamicFields = section.fields;

                    if (section.key === 'industrySpecificData' && persona?.industrySpecificData) {
                        dynamicFields = Object.keys(persona.industrySpecificData)
                            .filter(k => !['ragStatus', 'fetchedReviews'].includes(k))
                            .map(k => ({
                                key: `industrySpecificData.${k}`,
                                label: k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase()),
                                icon: Boxes
                            }));
                    }

                    const fieldsWithData = dynamicFields.filter(f => hasFieldValue(f.key));
                    const fieldsWithoutData = dynamicFields.filter(f => !hasFieldValue(f.key));

                    return (
                        <Card key={section.key} className={cn(
                            "overflow-hidden border-2 transition-all",
                            isSectionEnabled ? colors.border : "border-slate-200 opacity-60"
                        )}>
                            <CardHeader className={cn("pb-3", isSectionEnabled ? colors.light : "bg-slate-50")}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", isSectionEnabled ? colors.bg : "bg-slate-200")}>
                                            <Icon className={cn("w-5 h-5", isSectionEnabled ? colors.text : "text-slate-400")} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {section.label}
                                                {fieldsWithData.length > 0 && (
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        {fieldsWithData.length} populated
                                                    </Badge>
                                                )}
                                                {!isSectionEnabled && (
                                                    <Badge variant="outline" className="text-xs text-slate-500">
                                                        <EyeOff className="w-3 h-3 mr-1" />Hidden
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="text-xs">{section.description}</CardDescription>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={isSectionEnabled}
                                        onCheckedChange={() => handleSectionToggle(section.key)}
                                        disabled={isPending}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>
                            </CardHeader>

                            {isSectionEnabled && (fieldsWithData.length > 0 || fieldsWithoutData.length > 0) && (
                                <CardContent className="pt-0 pb-4">
                                    <Separator className="mb-4" />

                                    {fieldsWithData.length > 0 && (
                                        <div className="space-y-4">
                                            {fieldsWithData.map((field) => {
                                                const FieldIcon = field.icon;
                                                const isFieldEnabled = visibilityState.fields[field.key] !== false;
                                                const value = getFieldValue(field.key);

                                                return (
                                                    <div
                                                        key={field.key}
                                                        className={cn(
                                                            "p-4 rounded-lg border transition-all",
                                                            isFieldEnabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-50"
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <FieldIcon className="w-4 h-4 text-slate-500" />
                                                                <span className="font-medium text-slate-700">{field.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {!isFieldEnabled && (
                                                                    <Badge variant="outline" className="text-xs text-slate-400">
                                                                        <EyeOff className="w-3 h-3 mr-1" />Hidden
                                                                    </Badge>
                                                                )}
                                                                <Switch
                                                                    checked={isFieldEnabled}
                                                                    onCheckedChange={() => handleFieldToggle(field.key)}
                                                                    disabled={isPending}
                                                                    className="scale-90"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={cn(!isFieldEnabled && "opacity-50")}>
                                                            <FieldValueDisplay path={field.key} value={value} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {fieldsWithoutData.length > 0 && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Empty fields:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {fieldsWithoutData.map((field) => (
                                                    <Badge key={field.key} variant="outline" className="text-xs text-slate-400 border-dashed">
                                                        {field.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            )}

                            {isSectionEnabled && dynamicFields.length === 0 && section.key !== 'otherUsefulData' && (
                                <CardContent className="pt-0 pb-4">
                                    <Separator className="mb-4" />
                                    <p className="text-sm text-slate-400 text-center py-4">
                                        No data yet.{' '}
                                        <Link href="/partner/settings" className="text-indigo-500 hover:underline">
                                            Add in Business Profile →
                                        </Link>
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            <div className="text-center pt-4">
                <Link href="/partner/settings">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Settings
                    </Button>
                </Link>
            </div>
        </div>
    );
}