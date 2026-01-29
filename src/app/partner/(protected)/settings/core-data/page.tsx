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
    ExternalLink,
    Instagram,
    Facebook,
    Linkedin,
    Twitter,
    Youtube
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

function formatOperatingHours(hours: any): string {
    if (!hours) return '—';
    if (hours.isOpen24x7) return 'Open 24/7';
    if (hours.appointmentOnly) return 'By Appointment Only';

    if (hours.schedule) {
        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const shortDays: Record<string, string> = {
            monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
            thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
        };

        const openDays: string[] = [];
        const closedDays: string[] = [];
        let sampleTime = '';

        dayOrder.forEach(day => {
            const sched = hours.schedule[day];
            if (sched?.isOpen || (sched?.openTime && sched?.closeTime)) {
                openDays.push(shortDays[day]);
                if (!sampleTime && (sched.openTime || sched.open)) {
                    const open = sched.openTime || sched.open;
                    const close = sched.closeTime || sched.close;
                    sampleTime = `${open} - ${close}`;
                }
            } else {
                closedDays.push(shortDays[day]);
            }
        });

        if (openDays.length === 0) return 'Closed';
        if (openDays.length === 7) return sampleTime ? `Daily ${sampleTime}` : 'Open Daily';

        if (openDays.length >= 5 && closedDays.length <= 2) {
            const closedStr = closedDays.length > 0 ? ` (Closed ${closedDays.join(', ')})` : '';
            return sampleTime ? `${sampleTime}${closedStr}` : `Open ${openDays.length} days/week`;
        }

        return `${openDays.join(', ')}${sampleTime ? ` · ${sampleTime}` : ''}`;
    }

    if (hours.specialNote) return hours.specialNote;
    return 'Schedule configured';
}

function formatAddress(address: any): string {
    if (!address) return '—';
    if (typeof address === 'string') return address;

    const parts: string[] = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode || address.pincode) parts.push(address.postalCode || address.pincode);
    if (address.country) parts.push(address.country);

    return parts.length > 0 ? parts.join(', ') : '—';
}

function formatSocialMedia(social: any): string {
    if (!social || typeof social !== 'object') return '—';

    const platforms = Object.entries(social)
        .filter(([_, value]) => value && value !== '')
        .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

    if (platforms.length === 0) return '—';
    if (platforms.length <= 3) return platforms.join(', ');
    return `${platforms.slice(0, 3).join(', ')} +${platforms.length - 3} more`;
}

function formatIndustry(industry: any): string {
    if (!industry) return '—';
    if (typeof industry === 'string') return industry;

    const parts: string[] = [];
    if (industry.category) {
        parts.push(industry.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
    }
    if (industry.name && industry.name !== industry.category) {
        parts.push(industry.name);
    }

    return parts.length > 0 ? parts.join(' → ') : '—';
}

function formatPolicies(policies: any): string {
    if (!policies || typeof policies !== 'object') return '—';

    const enabled = Object.entries(policies)
        .filter(([_, value]) => value === true)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

    if (enabled.length === 0) return 'No policies set';
    if (enabled.length <= 2) return enabled.join(', ');
    return `${enabled.length} policies configured`;
}

function formatProducts(products: any): string {
    if (!products) return '—';
    if (!Array.isArray(products)) return '—';
    if (products.length === 0) return '—';

    const names = products
        .slice(0, 3)
        .map((p: any) => typeof p === 'string' ? p : p.name)
        .filter(Boolean);

    if (names.length === 0) return `${products.length} items`;
    if (products.length <= 3) return names.join(', ');
    return `${names.join(', ')} +${products.length - 3} more`;
}

function formatFAQs(faqs: any): string {
    if (!faqs) return '—';
    if (!Array.isArray(faqs)) return '—';
    if (faqs.length === 0) return '—';
    return `${faqs.length} FAQ${faqs.length === 1 ? '' : 's'} configured`;
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

            console.log('[CoreData] Fetched persona:', JSON.stringify(personaResult.persona, null, 2));
            console.log('[CoreData] Operating Hours:', personaResult.persona?.identity?.operatingHours);

            if (personaResult.success && personaResult.persona) {
                console.log('[CoreData] Loaded persona:', personaResult.persona);
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
                toast.success(`${SECTIONS_CONFIG.find(s => s.key === sectionKey)?.label} ${newValue ? 'enabled' : 'disabled'}`);
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

    const formatFieldValue = (path: string, value: any): string => {
        if (value === undefined || value === null) return '—';

        // Handle specific field types by path
        if (path.endsWith('.operatingHours') || path === 'identity.operatingHours') {
            return formatOperatingHours(value);
        }
        if (path.endsWith('.address') || path === 'identity.address') {
            return formatAddress(value);
        }
        if (path.endsWith('.socialMedia') || path === 'identity.socialMedia') {
            return formatSocialMedia(value);
        }
        if (path.endsWith('.industry') || path === 'identity.industry') {
            return formatIndustry(value);
        }
        if (path.endsWith('.policies') || path === 'knowledge.policies') {
            return formatPolicies(value);
        }
        if (path.endsWith('.productsOrServices') || path === 'knowledge.productsOrServices') {
            return formatProducts(value);
        }
        if (path.endsWith('.faqs') || path === 'knowledge.faqs') {
            return formatFAQs(value);
        }

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length === 0) return '—';
            if (typeof value[0] === 'object') {
                const names = value.slice(0, 3).map((v: any) => v.name || v.label || v.title).filter(Boolean);
                if (names.length > 0) {
                    return value.length <= 3 ? names.join(', ') : `${names.join(', ')} +${value.length - 3}`;
                }
                return `${value.length} items`;
            }
            return value.slice(0, 3).join(', ') + (value.length > 3 ? ` +${value.length - 3}` : '');
        }

        // Handle objects (generic fallback)
        if (typeof value === 'object') {
            // Check for common patterns
            if (value.city) return formatAddress(value);
            if (value.name) return value.name;
            if (value.label) return value.label;
            if (value.value) return String(value.value);

            // Count non-empty keys
            const nonEmptyKeys = Object.entries(value).filter(([_, v]) => v && v !== '').length;
            if (nonEmptyKeys > 0) return `${nonEmptyKeys} fields configured`;
            return '—';
        }

        // Handle strings
        if (typeof value === 'string') {
            if (value === '') return '—';
            if (value.length > 60) return value.substring(0, 60) + '...';
            return value;
        }

        // Handle numbers, booleans
        return String(value);
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
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="mb-4">
                            <Link href="/partner/settings" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Settings
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Brain className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Core Data Access
                            </h1>
                        </div>

                        <p className="text-slate-500 max-w-2xl">
                            Control exactly what your AI assistant can see and use. Toggle sections or individual fields to manage privacy and context.
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-medium text-slate-900 mb-1">
                            {enabledCount}/7 sections active
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-600 h-8 gap-2"
                            onClick={fetchData}
                        >
                            <RefreshCw className={cn("w-4 h-4", isPending && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Sync Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                        <strong>Data synced from Business Profile.</strong> Changes made in{' '}
                        <Link href="/partner/settings" className="text-amber-700 underline hover:text-amber-900">
                            Settings → Business Profile
                        </Link>{' '}
                        will appear here automatically. Use toggles below to control AI visibility.
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {SECTIONS_CONFIG.map((section) => {
                        const isSectionEnabled = visibilityState.sections[section.key] !== false;
                        const Icon = section.icon;
                        const colors = COLOR_CLASSES[section.color];

                        const dynamicFields = section.key === 'industrySpecificData' && persona?.industrySpecificData
                            ? Object.keys(persona.industrySpecificData)
                                .filter(k => k !== 'ragStatus')
                                .map(k => ({
                                    key: `industrySpecificData.${k}`,
                                    label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
                                    icon: Boxes
                                }))
                            : section.fields;

                        const fieldsWithData = dynamicFields.filter(f => hasFieldValue(f.key));
                        const fieldsWithoutData = dynamicFields.filter(f => !hasFieldValue(f.key));

                        return (
                            <Card key={section.key} className={cn("overflow-hidden border-2 transition-colors",
                                isSectionEnabled ? colors.border : "border-slate-100")}>
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
                                                        <Badge variant="secondary" className="text-xs">
                                                            {fieldsWithData.length} fields
                                                        </Badge>
                                                    )}
                                                    {!isSectionEnabled && (
                                                        <Badge variant="outline" className="text-xs text-slate-500">
                                                            <EyeOff className="w-3 h-3 mr-1" />
                                                            Hidden
                                                        </Badge>
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-0.5">
                                                    {section.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500">
                                                {isSectionEnabled ? 'Visible to Core' : 'Hidden from Core'}
                                            </span>
                                            <Switch
                                                checked={isSectionEnabled}
                                                onCheckedChange={() => handleSectionToggle(section.key)}
                                                disabled={isPending}
                                                className="data-[state=checked]:bg-green-500"
                                            />
                                        </div>
                                    </div>
                                </CardHeader>

                                {isSectionEnabled && dynamicFields.length > 0 && (
                                    <CardContent className="pt-0 pb-4">
                                        <Separator className="mb-4" />

                                        {/* Fields with data */}
                                        {fieldsWithData.length > 0 && (
                                            <div className="space-y-2 mb-4">
                                                {fieldsWithData.map((field) => {
                                                    const FieldIcon = field.icon;
                                                    const isFieldEnabled = visibilityState.fields[field.key] !== false;
                                                    const value = getFieldValue(field.key);
                                                    const displayValue = formatFieldValue(field.key, value);

                                                    return (
                                                        <div
                                                            key={field.key}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                                isFieldEnabled
                                                                    ? "bg-white border-slate-200 hover:border-slate-300"
                                                                    : "bg-slate-50 border-slate-100"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <FieldIcon className={cn(
                                                                    "w-4 h-4 shrink-0",
                                                                    isFieldEnabled ? "text-slate-500" : "text-slate-300"
                                                                )} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={cn(
                                                                        "text-sm font-medium",
                                                                        isFieldEnabled ? "text-slate-700" : "text-slate-400"
                                                                    )}>
                                                                        {field.label}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "text-xs truncate",
                                                                        isFieldEnabled ? "text-green-600 font-medium" : "text-slate-400"
                                                                    )}>
                                                                        {displayValue}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-4">
                                                                {!isFieldEnabled && (
                                                                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-200">
                                                                        <EyeOff className="w-3 h-3" />
                                                                    </Badge>
                                                                )}
                                                                <Switch
                                                                    checked={isFieldEnabled}
                                                                    onCheckedChange={() => handleFieldToggle(field.key)}
                                                                    disabled={isPending}
                                                                    className="scale-90 data-[state=checked]:bg-indigo-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Fields without data */}
                                        {fieldsWithoutData.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-400 mb-2">Missing data (add in Business Profile):</p>
                                                <div className="flex flex-wrap gap-2">
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
                                        <p className="text-sm text-slate-400 italic text-center py-4">
                                            No data in this section yet.{' '}
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

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <Link href="/partner/settings">
                        <Button variant="outline" size="lg" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Settings
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}