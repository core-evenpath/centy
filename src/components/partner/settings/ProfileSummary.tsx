"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Building2,
    Phone,
    Mail,
    Globe,
    MapPin,
    Clock,
    Tag,
    Star,
    Award,
    CreditCard,
    HelpCircle,
    FileText,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface ProfileSummaryProps {
    persona: Partial<BusinessPersona>;
    onEditField?: (fieldPath: string) => void;
}

interface SummarySection {
    title: string;
    icon: React.ElementType;
    color: string;
    items: { label: string; value: string | string[] | undefined; path: string }[];
}

export default function ProfileSummary({ persona, onEditField }: ProfileSummaryProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('identity');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const identity = persona.identity;
    const personality = persona.personality;
    const knowledge = persona.knowledge;

    // Build sections with their data
    const sections: SummarySection[] = [
        {
            title: 'Business Identity',
            icon: Building2,
            color: 'text-indigo-600',
            items: [
                { label: 'Business Name', value: identity?.name, path: 'identity.name' },
                { label: 'Tagline', value: personality?.tagline, path: 'personality.tagline' },
                { label: 'Industry', value: identity?.industry?.name, path: 'identity.industry.name' },
                { label: 'Description', value: personality?.description, path: 'personality.description' },
                { label: 'Founded', value: persona.industrySpecificData?.founded, path: 'industrySpecificData.founded' },
                { label: 'Team Size', value: persona.industrySpecificData?.teamSize, path: 'industrySpecificData.teamSize' },
            ],
        },
        {
            title: 'Contact Information',
            icon: Phone,
            color: 'text-emerald-600',
            items: [
                { label: 'Phone', value: identity?.phone, path: 'identity.phone' },
                { label: 'WhatsApp', value: identity?.whatsAppNumber, path: 'identity.whatsAppNumber' },
                { label: 'Email', value: identity?.email, path: 'identity.email' },
                { label: 'Website', value: identity?.website, path: 'identity.website' },
                { label: 'Address', value: formatAddress(identity?.address), path: 'identity.address' },
                { label: 'Service Areas', value: identity?.serviceArea, path: 'identity.serviceArea' },
            ],
        },
        {
            title: 'Operating Hours',
            icon: Clock,
            color: 'text-amber-600',
            items: [
                { label: 'Status', value: getHoursStatus(identity?.operatingHours), path: 'identity.operatingHours' },
                { label: 'Response Time', value: personality?.responseTimeExpectation, path: 'personality.responseTimeExpectation' },
                { label: 'Timezone', value: identity?.timezone, path: 'identity.timezone' },
            ],
        },
        {
            title: 'Products & Services',
            icon: Tag,
            color: 'text-violet-600',
            items: [
                { label: 'Offerings', value: knowledge?.productsOrServices?.map(p => p.name).filter(Boolean), path: 'knowledge.productsOrServices' },
                { label: 'Pricing Model', value: knowledge?.pricingModel, path: 'knowledge.pricingModel' },
                { label: 'Payment Methods', value: knowledge?.acceptedPayments, path: 'knowledge.acceptedPayments' },
            ],
        },
        {
            title: 'Unique Selling Points',
            icon: Star,
            color: 'text-rose-600',
            items: [
                { label: 'USPs', value: personality?.uniqueSellingPoints, path: 'personality.uniqueSellingPoints' },
                { label: 'Voice & Tone', value: personality?.voiceTone, path: 'personality.voiceTone' },
                { label: 'Communication Style', value: personality?.communicationStyle, path: 'personality.communicationStyle' },
            ],
        },
        {
            title: 'Credentials',
            icon: Award,
            color: 'text-teal-600',
            items: [
                { label: 'Certifications', value: knowledge?.certifications, path: 'knowledge.certifications' },
                { label: 'Awards', value: knowledge?.awards, path: 'knowledge.awards' },
            ],
        },
        {
            title: 'FAQs & Policies',
            icon: HelpCircle,
            color: 'text-blue-600',
            items: [
                { label: 'FAQs', value: knowledge?.faqs?.length ? `${knowledge.faqs.length} questions` : undefined, path: 'knowledge.faqs' },
                { label: 'Return Policy', value: knowledge?.policies?.returnPolicy ? 'Defined' : undefined, path: 'knowledge.policies.returnPolicy' },
                { label: 'Refund Policy', value: knowledge?.policies?.refundPolicy ? 'Defined' : undefined, path: 'knowledge.policies.refundPolicy' },
                { label: 'Cancellation', value: knowledge?.policies?.cancellationPolicy ? 'Defined' : undefined, path: 'knowledge.policies.cancellationPolicy' },
            ],
        },
    ];

    const handleCopy = (value: string, fieldPath: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(fieldPath);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Calculate completion stats
    const totalFields = sections.reduce((acc, s) => acc + s.items.length, 0);
    const filledFields = sections.reduce((acc, s) =>
        acc + s.items.filter(i => i.value && (Array.isArray(i.value) ? i.value.length > 0 : true)).length
        , 0);
    const completionPercent = Math.round((filledFields / totalFields) * 100);

    return (
        <div className="space-y-4">
            {/* Header with completion */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900">Profile Summary</h3>
                    <p className="text-xs text-slate-500">
                        Overview of your business profile data
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="text-2xl font-bold text-slate-900">{completionPercent}%</span>
                        <p className="text-xs text-slate-500">{filledFields}/{totalFields} fields</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="4"
                            />
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                fill="none"
                                stroke={completionPercent >= 80 ? '#10b981' : completionPercent >= 50 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="4"
                                strokeDasharray={`${(completionPercent / 100) * 125.6} 125.6`}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-2">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSection === section.title;
                    const filledInSection = section.items.filter(i =>
                        i.value && (Array.isArray(i.value) ? i.value.length > 0 : true)
                    ).length;
                    const emptyInSection = section.items.length - filledInSection;

                    return (
                        <div
                            key={section.title}
                            className={cn(
                                "bg-white rounded-xl border transition-all",
                                isExpanded ? "border-slate-300 shadow-sm" : "border-slate-200"
                            )}
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => setExpandedSection(isExpanded ? null : section.title)}
                                className="w-full px-4 py-3 flex items-center gap-3 text-left"
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center",
                                    filledInSection === section.items.length ? 'bg-emerald-50' : 'bg-slate-50'
                                )}>
                                    <Icon className={cn("w-4.5 h-4.5", section.color)} />
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium text-slate-900 text-sm">{section.title}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-emerald-600">{filledInSection} filled</span>
                                        {emptyInSection > 0 && (
                                            <span className="text-xs text-slate-400">• {emptyInSection} empty</span>
                                        )}
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-slate-100">
                                    <div className="pt-3 space-y-2">
                                        {section.items.map((item) => {
                                            const hasValue = item.value && (Array.isArray(item.value) ? item.value.length > 0 : true);
                                            const displayValue = Array.isArray(item.value)
                                                ? item.value.join(', ')
                                                : item.value;

                                            return (
                                                <div
                                                    key={item.path}
                                                    className={cn(
                                                        "flex items-start gap-3 p-2 rounded-lg group",
                                                        hasValue ? "bg-slate-50" : "bg-amber-50/50"
                                                    )}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-slate-500">{item.label}</p>
                                                        {hasValue ? (
                                                            <p className="text-sm text-slate-900 mt-0.5 break-words">
                                                                {displayValue && displayValue.length > 150
                                                                    ? `${displayValue.substring(0, 150)}...`
                                                                    : displayValue}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-amber-600 mt-0.5 flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Not set
                                                            </p>
                                                        )}
                                                    </div>
                                                    {hasValue && displayValue && (
                                                        <button
                                                            onClick={() => handleCopy(displayValue, item.path)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white rounded transition-all"
                                                            title="Copy"
                                                        >
                                                            {copiedField === item.path ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{filledFields}</p>
                    <p className="text-xs text-emerald-700">Fields Filled</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{totalFields - filledFields}</p>
                    <p className="text-xs text-amber-700">Empty Fields</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{sections.length}</p>
                    <p className="text-xs text-indigo-700">Sections</p>
                </div>
            </div>
        </div>
    );
}

// Helper functions
function formatAddress(address: any): string | undefined {
    if (!address) return undefined;
    const parts = [address.street, address.city, address.state, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : undefined;
}

function getHoursStatus(hours: any): string | undefined {
    if (!hours) return undefined;
    if (hours.isOpen24x7) return 'Open 24/7';
    if (hours.appointmentOnly) return 'By Appointment';
    if (hours.onlineAlways) return 'Always Online';
    if (hours.schedule) return 'Custom Schedule';
    if (hours.specialNote) return hours.specialNote;
    return undefined;
}
