'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    ShieldCheck,
    BrainCircuit,
    Package,
    Users,
    Globe,
    Boxes,
    FileText,
    ExternalLink,
    ChevronDown,
    MapPin,
    Clock,
    Phone,
    Mail,
    LayoutGrid,
    MessageSquare,
    DollarSign,
    Lightbulb,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessPersona, CoreVisibilitySettings } from '@/lib/business-persona-types';
import { updateCoreVisibilityAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CoreVisibilityPanelProps {
    partnerId: string;
    persona: BusinessPersona;
    className?: string;
    onVisibilityChange?: () => void;
}

const DEFAULT_SECTIONS = {
    identity: true,
    personality: true,
    knowledge: true,
    customerProfile: true,
    webIntelligence: true,
    industrySpecificData: true,
    otherUsefulData: true,
};

type SectionKey = keyof typeof DEFAULT_SECTIONS;

interface FieldConfig {
    key: string;
    label: string;
    icon?: React.ElementType;
}

interface SectionConfig {
    key: SectionKey;
    label: string;
    description: string;
    icon: React.ElementType;
    fields: FieldConfig[];
}

const SECTIONS_CONFIG: SectionConfig[] = [
    {
        key: 'identity',
        label: 'Business Identity',
        description: 'Name, contact, address, hours',
        icon: ShieldCheck,
        fields: [
            { key: 'identity.name', label: 'Business Name', icon: LayoutGrid },
            { key: 'identity.industry', label: 'Industry & Category', icon: Boxes },
            { key: 'identity.email', label: 'Email Address', icon: Mail },
            { key: 'identity.phone', label: 'Phone Number', icon: Phone },
            { key: 'identity.address', label: 'Address & Location', icon: MapPin },
            { key: 'identity.operatingHours', label: 'Operating Hours', icon: Clock },
            { key: 'identity.website', label: 'Website', icon: Globe },
            { key: 'identity.socialMedia', label: 'Social Media Links', icon: Users },
        ]
    },
    {
        key: 'personality',
        label: 'Brand & Voice',
        description: 'Tagline, tone, values, story',
        icon: BrainCircuit,
        fields: [
            { key: 'personality.tagline', label: 'Tagline', icon: MessageSquare },
            { key: 'personality.description', label: 'Description', icon: FileText },
            { key: 'personality.voiceTone', label: 'Voice Tone', icon: MessageSquare },
            { key: 'personality.brandValues', label: 'Brand Values', icon: ShieldCheck },
        ]
    },
    {
        key: 'knowledge',
        label: 'Products & Services',
        description: 'Offerings, FAQs, policies',
        icon: Package,
        fields: [
            { key: 'knowledge.productsOrServices', label: 'Products/Services', icon: Package },
            { key: 'knowledge.pricingModel', label: 'Pricing Model', icon: DollarSign },
            { key: 'knowledge.faqs', label: 'FAQs', icon: MessageSquare },
            { key: 'knowledge.policies', label: 'Business Policies', icon: Lock },
        ]
    },
    {
        key: 'customerProfile',
        label: 'Customer Profile',
        description: 'Target audience, pain points',
        icon: Users,
        fields: [
            { key: 'customerProfile.targetAudience', label: 'Target Audience', icon: Users },
            { key: 'customerProfile.customerPainPoints', label: 'Pain Points', icon: AlertCircle },
            { key: 'customerProfile.commonQueries', label: 'Common Queries', icon: MessageSquare },
        ]
    },
    {
        key: 'webIntelligence',
        label: 'Web Data',
        description: 'Imported from Google/website',
        icon: Globe,
        fields: [] // Treated as a bulk section for now
    },
    {
        key: 'industrySpecificData',
        label: 'Industry Data',
        description: 'Specialized business fields',
        icon: Boxes,
        fields: [] // Dynamic fields, treated as bulk
    },
    {
        key: 'otherUsefulData',
        label: 'Other Data',
        description: 'Additional notes & context',
        icon: FileText,
        fields: [] // Dynamic list
    }
];

import { AlertCircle } from 'lucide-react';

export function CoreVisibilityPanel({
    partnerId,
    persona,
    className,
    onVisibilityChange
}: CoreVisibilityPanelProps) {
    const [isPending, startTransition] = useTransition();

    // -- State Initialization --
    const getInitialState = () => {
        const cv = persona.coreVisibility || { sections: DEFAULT_SECTIONS, fields: {} };
        return {
            sections: { ...DEFAULT_SECTIONS, ...cv.sections },
            fields: { ...cv.fields }
        };
    };

    const [state, setState] = useState(getInitialState);

    // Sync with external updates
    useEffect(() => {
        setState(getInitialState());
    }, [persona.coreVisibility]);


    // -- Handlers --
    const handleSave = (newSections: Record<string, boolean>, newFields: Record<string, boolean>) => {
        startTransition(async () => {
            try {
                const result = await updateCoreVisibilityAction(partnerId, {
                    sections: newSections,
                    fields: newFields,
                    lastUpdatedAt: new Date().toISOString(),
                    lastUpdatedBy: 'user',
                });

                if (result.success) {
                    toast.success('Visibility settings updated');
                    onVisibilityChange?.();
                } else {
                    toast.error(result.message || 'Failed to update');
                    // Revert on failure
                    setState(getInitialState());
                }
            } catch (error) {
                toast.error('Failed to update visibility');
                console.error(error);
                setState(getInitialState());
            }
        });
    };

    const toggleSection = (key: SectionKey) => {
        const newValue = !state.sections[key];
        const newSections = { ...state.sections, [key]: newValue };

        // Optimistic update
        setState(prev => ({ ...prev, sections: newSections }));
        handleSave(newSections, state.fields);
    };

    const toggleField = (fieldKey: string) => {
        const currentVal = state.fields[fieldKey] ?? true; // Default to true if undefined
        const newValue = !currentVal;
        const newFields = { ...state.fields, [fieldKey]: newValue };

        // Optimistic update
        setState(prev => ({ ...prev, fields: newFields }));
        handleSave(state.sections, newFields);
    };

    const enabledCount = Object.values(state.sections).filter(Boolean).length;
    const totalCount = SECTIONS_CONFIG.length;

    return (
        <Card className={cn("border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30", className)}>
            <CardHeader className="pb-3 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 rounded-xl">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                What "Core" Can Access
                                <Link
                                    href="/partner/settings/core-data"
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-normal flex items-center gap-1 hover:underline"
                                >
                                    View All <ExternalLink className="w-3 h-3" />
                                </Link>
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Control which data your AI assistant can use.
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-2 pb-2">
                <Accordion type="multiple" className="space-y-2">
                    {SECTIONS_CONFIG.map((section) => {
                        const isSectionEnabled = state.sections[section.key];
                        const Icon = section.icon;

                        return (
                            <AccordionItem
                                key={section.key}
                                value={section.key}
                                className="border border-slate-200 bg-white rounded-xl px-4 data-[state=open]:border-indigo-200 transition-colors"
                            >
                                <div className="flex items-center py-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "p-2 rounded-lg mr-4 shrink-0 transition-colors",
                                        isSectionEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className={cn("font-medium", isSectionEnabled ? "text-slate-900" : "text-slate-500")}>
                                                {section.label}
                                            </h3>
                                            {!isSectionEnabled && (
                                                <Badge variant="outline" className="text-xs text-slate-500 font-normal px-1.5 py-0 h-5">
                                                    Hidden
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 truncate">{section.description}</p>
                                    </div>

                                    {/* Master Switch */}
                                    <div className="flex items-center gap-4">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Switch
                                                checked={isSectionEnabled}
                                                onCheckedChange={() => toggleSection(section.key)}
                                                className="data-[state=checked]:bg-green-500"
                                            />
                                        </div>

                                        {/* Expand Chevron (only if fields exist) */}
                                        {section.fields.length > 0 && (
                                            <AccordionTrigger className="p-0 hover:no-underline py-0" disabled={!isSectionEnabled}>
                                                {/* Trigger uses default chevron, hiding it here to customize if needed */}
                                                <span className="sr-only">Toggle</span>
                                            </AccordionTrigger>
                                        )}
                                    </div>
                                </div>

                                {section.fields.length > 0 && (
                                    <AccordionContent className="pt-0 pb-4 pl-[3.25rem]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                            {section.fields.map(field => {
                                                const FieldIcon = field.icon || Lightbulb;
                                                const isFieldEnabled = state.fields[field.key] ?? true;
                                                const isDisabled = !isSectionEnabled || isPending;

                                                return (
                                                    <div
                                                        key={field.key}
                                                        className={cn(
                                                            "flex items-center justify-between p-2 rounded-lg border transition-all",
                                                            isFieldEnabled
                                                                ? "bg-slate-50 border-slate-200"
                                                                : "bg-slate-50/50 border-slate-100 opacity-70"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                                            <FieldIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                            <span className="text-sm text-slate-700 truncate">{field.label}</span>
                                                        </div>
                                                        <Switch
                                                            checked={isFieldEnabled}
                                                            onCheckedChange={() => toggleField(field.key)}
                                                            disabled={isDisabled}
                                                            className="scale-75 data-[state=checked]:bg-indigo-500"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                )}
                            </AccordionItem>
                        );
                    })}
                </Accordion>

                <div className="mt-4 p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-sm text-blue-700 flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                        <strong>Tip:</strong> You can now toggle individual fields. Turning off a main section (e.g. "Business Identity") overrides all field settings within it.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
