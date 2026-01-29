'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
    getCoreAccessibleDataAction,
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
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
    Save
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CoreVisibilitySettings } from '@/lib/business-persona-types';

interface FieldConfig {
    key: string;
    label: string;
    icon: React.ElementType;
    description?: string;
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

    const formatFieldValue = (value: any): string => {
        if (value === undefined || value === null) return '—';
        if (Array.isArray(value)) {
            if (value.length === 0) return '—';
            if (typeof value[0] === 'object') return `${value.length} items`;
            return value.slice(0, 3).join(', ') + (value.length > 3 ? ` +${value.length - 3}` : '');
        }
        if (typeof value === 'object') {
            if (value.city) return `${value.city}${value.state ? `, ${value.state}` : ''}`;
            return 'Configured';
        }
        if (typeof value === 'string' && value.length > 50) {
            return value.substring(0, 50) + '...';
        }
        return String(value);
    };

    if (authLoading || loading) {
        return (
            <div className="p-8 space-y-4">
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
                            Control exactly what your AI assistant can see and use. Toggle entire sections or individual data points to manage privacy and context.
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

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <p>
                        How it works: Toggle sections or individual fields to control what data Core (your AI) can access when responding to customers. Hidden data won't be included in AI responses.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {SECTIONS_CONFIG.map((section) => {
                        const isSectionEnabled = visibilityState.sections[section.key] !== false;
                        const Icon = section.icon;
                        const colors = COLOR_CLASSES[section.color];

                        const dynamicFields = section.key === 'industrySpecificData' && persona?.industrySpecificData
                            ? Object.keys(persona.industrySpecificData).map(k => ({
                                key: `industrySpecificData.${k}`,
                                label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
                                icon: Boxes
                            }))
                            : section.fields;

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
                                                    {!isSectionEnabled && (
                                                        <Badge variant="outline" className="bg-white/50 text-slate-500 border-slate-200 h-5 text-[10px] font-normal gap-1">
                                                            <EyeOff className="w-3 h-3" />
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
                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                                    <div className="divide-y divide-slate-100">
                                        <div className="p-1 bg-white">
                                            {dynamicFields.map((field) => {
                                                const FieldIcon = field.icon || Boxes;
                                                const isFieldEnabled = visibilityState.fields[field.key] !== false;
                                                const value = getFieldValue(field.key);
                                                const hasValue = value !== undefined && value !== null && value !== '' &&
                                                    !(Array.isArray(value) && value.length === 0);

                                                return (
                                                    <div key={field.key} className="flex items-center justify-between p-3 hover:bg-slate-50/50 rounded-md transition-colors group">
                                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                                            <div className="mt-1">
                                                                <FieldIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-sm font-medium text-slate-700">
                                                                    {field.label}
                                                                </div>
                                                                <div className={cn("text-sm truncate", hasValue ? "text-slate-600" : "text-slate-400 italic")}>
                                                                    {hasValue ? formatFieldValue(value) : 'No data'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 pl-4">
                                                            {!isFieldEnabled && (
                                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 h-5 px-1.5 text-[10px]">
                                                                    <EyeOff className="w-3 h-3 mr-1" />
                                                                    Excluded
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
                                    </div>
                                )}

                                {isSectionEnabled && dynamicFields.length === 0 && section.key !== 'otherUsefulData' && (
                                    <div className="p-8 text-center bg-slate-50/50">
                                        <div className="text-sm text-slate-400">
                                            No data in this section yet
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Back Button */}
                <div className="flex justify-center pt-8">
                    <Link href="/partner/settings">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Settings
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
