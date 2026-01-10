"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    Sparkles,
    Clock,
    Phone,
    Tag,
    MessageSquare,
    Edit3,
    Check,
    X,
    ChevronRight,
    Building2,
    Award,
    FileText,
    RefreshCw,
    Zap,
    AlertCircle
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface ProfileSummaryProps {
    persona: Partial<BusinessPersona>;
    onFieldUpdate?: (path: string, value: any) => void;
    onOpenAIChat?: () => void;
}

export default function ProfileSummary({ persona, onFieldUpdate, onOpenAIChat }: ProfileSummaryProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const identity = persona.identity;
    const personality = persona.personality;
    const knowledge = persona.knowledge;

    // Generate AI Business Blurb from profile data
    const businessBlurb = useMemo(() => {
        const parts: string[] = [];

        // Business name and tagline
        if (identity?.name) {
            parts.push(identity.name);
            if (personality?.tagline) {
                parts.push(`— ${personality.tagline}`);
            }
        }

        // What they do
        if (personality?.description) {
            const shortDesc = personality.description.length > 150
                ? personality.description.substring(0, 150) + '...'
                : personality.description;
            parts.push(shortDesc);
        }

        // Location
        if (identity?.address?.city && identity?.address?.state) {
            parts.push(`Based in ${identity.address.city}, ${identity.address.state}.`);
        }

        // USPs
        if (personality?.uniqueSellingPoints?.length) {
            const usps = personality.uniqueSellingPoints.slice(0, 3);
            parts.push(`Known for: ${usps.join(', ')}.`);
        }

        // Services count
        if (knowledge?.productsOrServices?.length) {
            parts.push(`Offering ${knowledge.productsOrServices.length} services/products.`);
        }

        return parts.length > 0 ? parts.join(' ') : null;
    }, [identity, personality, knowledge]);

    // Quick Actions - Frequently updated fields
    const quickActions = [
        {
            id: 'hours',
            icon: Clock,
            label: 'Operating Hours',
            value: getHoursDisplay(identity?.operatingHours),
            path: 'identity.operatingHours',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            editable: false, // Complex type - use AI
            hint: 'Use AI to update',
        },
        {
            id: 'phone',
            icon: Phone,
            label: 'Contact Number',
            value: identity?.phone || identity?.whatsAppNumber,
            path: 'identity.phone',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            editable: true,
        },
        {
            id: 'responseTime',
            icon: Zap,
            label: 'Response Time',
            value: personality?.responseTimeExpectation,
            path: 'personality.responseTimeExpectation',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            editable: true,
        },
        {
            id: 'services',
            icon: Tag,
            label: 'Services/Products',
            value: knowledge?.productsOrServices?.length
                ? `${knowledge.productsOrServices.length} items`
                : null,
            path: 'knowledge.productsOrServices',
            color: 'text-violet-600',
            bgColor: 'bg-violet-50',
            editable: false, // Array type - use AI
            hint: 'Use AI to add/remove',
        },
        {
            id: 'faqs',
            icon: MessageSquare,
            label: 'FAQs',
            value: knowledge?.faqs?.length
                ? `${knowledge.faqs.length} questions`
                : null,
            path: 'knowledge.faqs',
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
            editable: false, // Complex type - use AI
            hint: 'Use AI to manage',
        },
    ];

    // Stable Profile Data - Rarely changed
    const stableData = [
        { label: 'Business Name', value: identity?.name, path: 'identity.name' },
        { label: 'Tagline', value: personality?.tagline, path: 'personality.tagline' },
        { label: 'Industry', value: identity?.industry?.name, path: 'identity.industry.name' },
        { label: 'Email', value: identity?.email, path: 'identity.email' },
        { label: 'Website', value: identity?.website, path: 'identity.website' },
        { label: 'Address', value: formatAddress(identity?.address), path: 'identity.address' },
        { label: 'Certifications', value: knowledge?.certifications?.join(', '), path: 'knowledge.certifications' },
        { label: 'Awards', value: knowledge?.awards?.join(', '), path: 'knowledge.awards' },
    ].filter(item => item.value);

    // Missing critical fields
    const missingCritical = [
        !identity?.name && 'Business Name',
        !identity?.phone && 'Phone Number',
        !personality?.description && 'Description',
    ].filter(Boolean);

    const handleStartEdit = (fieldId: string, currentValue: string) => {
        setEditingField(fieldId);
        setEditValue(currentValue || '');
    };

    const handleSaveEdit = (path: string) => {
        if (onFieldUpdate && editValue.trim()) {
            onFieldUpdate(path, editValue.trim());
        }
        setEditingField(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    return (
        <div className="space-y-5">
            {/* AI Generated Blurb */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-slate-900">Business Summary</h3>
                            {onOpenAIChat && (
                                <button
                                    onClick={onOpenAIChat}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    Edit with AI
                                </button>
                            )}
                        </div>
                        {businessBlurb ? (
                            <p className="text-sm text-slate-700 leading-relaxed">{businessBlurb}</p>
                        ) : (
                            <p className="text-sm text-slate-500 italic">
                                Complete your profile to generate a business summary. Add your business name, description, and key details.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Missing Critical Fields Warning */}
            {missingCritical.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800">Missing essential information</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Add these to help AI respond better: {missingCritical.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions - Frequently Updated */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-900">Quick Updates</h4>
                    <span className="text-xs text-slate-500">Frequently changed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        const isEditing = editingField === action.id;

                        return (
                            <div
                                key={action.id}
                                className={cn(
                                    "rounded-xl p-4 border-2 transition-all",
                                    action.value
                                        ? `${action.bgColor} border-transparent`
                                        : "bg-slate-50 border-dashed border-slate-200"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center",
                                        action.value ? 'bg-white/60' : 'bg-white'
                                    )}>
                                        <Icon className={cn("w-4.5 h-4.5", action.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-500 mb-1">{action.label}</p>

                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveEdit(action.path);
                                                        if (e.key === 'Escape') handleCancelEdit();
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleSaveEdit(action.path)}
                                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    action.value ? "text-slate-900" : "text-slate-400"
                                                )}>
                                                    {action.value || 'Not set'}
                                                </p>
                                                {action.editable && action.value && onFieldUpdate ? (
                                                    <button
                                                        onClick={() => handleStartEdit(action.id, action.value as string)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                ) : !action.editable && action.hint && onOpenAIChat ? (
                                                    <button
                                                        onClick={onOpenAIChat}
                                                        className="text-xs text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        {action.hint}
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Core Profile - Stable Data */}
            {stableData.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-900">Core Profile</h4>
                        <span className="text-xs text-slate-500">Stable information</span>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {stableData.map((item, idx) => (
                            <div key={item.path} className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-slate-500">{item.label}</span>
                                <span className="text-sm font-medium text-slate-900 text-right max-w-[60%] truncate">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Update Prompt */}
            {onOpenAIChat && (
                <button
                    onClick={onOpenAIChat}
                    className="w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    Update Profile with AI
                </button>
            )}
        </div>
    );
}

// Helper functions
function formatAddress(address: any): string | undefined {
    if (!address) return undefined;
    const parts = [address.street, address.city, address.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : undefined;
}

function getHoursDisplay(hours: any): string | undefined {
    if (!hours) return undefined;
    if (hours.isOpen24x7) return 'Open 24/7';
    if (hours.appointmentOnly) return 'By Appointment';
    if (hours.onlineAlways) return 'Always Online';
    if (hours.specialNote) return hours.specialNote;
    if (hours.schedule) return 'Custom Schedule';
    return undefined;
}
