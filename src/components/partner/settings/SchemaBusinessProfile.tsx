'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, MapPin, Target, Shield, Globe, ChevronDown,
    Edit3, Check, X, Plus, Sparkles, Search, Eye, Award,
    Phone, Clock, HelpCircle, Bot, Zap, Trash2, EyeOff,
    LucideIcon, Landmark, GraduationCap, Heart, Briefcase,
    ShoppingBag, UtensilsCrossed, ShoppingCart, Car, Plane,
    PartyPopper, Wrench, MoreHorizontal, RefreshCw, AlertCircle,
    Download, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona, ImportMeta, UnmappedDataItem, FieldSource, ImportRecord } from '@/lib/business-persona-types';
import {
    getExpertiseSections,
    BUSINESS_PROFILE_CONFIG,
    type SectionConfig,
    type FieldConfig,
} from '@/lib/schemas';

import {
    getIndustries,
    getResolvedFunctions,
    searchFunctions,
    toSelectedCategories,
    findFunctionInfo,
    getCountriesForDropdown,
    CountryCode,
    ResolvedFunction,
    SelectedBusinessCategory,
} from '@/lib/business-taxonomy';
import { generateModulesFromCategories, type ModulesConfig } from '@/actions/module-generator-actions';

// ===== ICON MAPPINGS =====
const SECTION_ICONS: Record<string, LucideIcon> = {
    'brand-identity': Building2,
    'location-hours': MapPin,
    'expertise': Target,
    'audience-positioning': Target,
    'trust-support': Shield,
    'from-the-web': Globe,
};

const SECTION_COLORS: Record<string, string> = {
    'brand-identity': 'bg-indigo-500',
    'location-hours': 'bg-blue-500',
    'expertise': 'bg-emerald-500',
    'audience-positioning': 'bg-amber-500',
    'trust-support': 'bg-purple-500',
    'from-the-web': 'bg-pink-500',
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Landmark, GraduationCap, Heart, Briefcase, ShoppingBag,
    UtensilsCrossed, ShoppingCart, Sparkles, Car, Plane,
    Building: Building2, PartyPopper, Wrench, MoreHorizontal,
};

const SUBSECTION_ICONS: Record<string, LucideIcon> = {
    'basic-info': Building2, 'unique-value': Sparkles, 'visual-identity': Eye,
    'address': MapPin, 'service-coverage': Target, 'operating-hours': Clock, 'availability': Phone,
    'target-customers': Target, 'customer-journey': Zap, 'customer-pain-points': HelpCircle,
    'trust-signals': Award, 'testimonials': Heart, 'contact-info': Phone, 'policies': Shield,
    'online-presence': Globe, 'reviews': Award, 'web-mentions': Globe,
    'menu': UtensilsCrossed, 'specialties': Sparkles, 'services': Briefcase,
    'products': ShoppingBag, 'pricing': Building2, 'experience': Award,
    'certifications': Award, 'team': Target,
};

const EMPTY_CATEGORIES: any[] = [];

// ===== PROPS =====
interface SchemaBusinessProfileProps {
    persona: Partial<BusinessPersona>;
    onUpdate: (path: string, value: any) => Promise<void>;
    onPreviewAI?: () => void;
    onProcessAI?: () => Promise<void>;
    onModulesGenerated?: (config: ModulesConfig) => Promise<void>;
    onImportData?: () => void;
    onClearAll?: () => void;
}

// ===== AI INSIGHT TYPE =====
interface AIInsight {
    id: string;
    type: 'critical' | 'improvement' | 'opportunity' | 'data_quality' | 'mapping' | 'sync';
    icon: string;
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
    section?: string;
    suggestion?: string;
    action: string;
    autoFill?: { path: string; value: string };
}

// ===== PROGRESS RING =====
function ProgressRing({ value }: { value: number }) {
    const radius = 52;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r={radius} stroke="#e2e8f0" strokeWidth="8" fill="none" />
                <circle cx="64" cy="64" r={radius} stroke={color} strokeWidth="8" fill="none"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{Math.round(value)}%</span>
                <span className="text-xs text-slate-500">Complete</span>
            </div>
        </div>
    );
}

// ===== COLLAPSIBLE SECTION =====
function Section({
    title, icon: Icon, iconBg, children, defaultOpen = false, description, badge, industrySpecific, isWebData
}: {
    title: string; icon: LucideIcon; iconBg: string; children: React.ReactNode;
    defaultOpen?: boolean; description?: string; badge?: string; industrySpecific?: boolean; isWebData?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full px-6 py-5 flex items-center gap-4 hover:bg-slate-50/50 transition-all">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg", iconBg)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-[15px]">{title}</h3>
                        {industrySpecific && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Dynamic</span>}
                        {isWebData && badge && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{badge}</span>}
                    </div>
                    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                </div>
                <span className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", isOpen && "bg-slate-100 rotate-180")}>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </span>
            </button>
            {isOpen && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
        </div>
    );
}

// ===== EDITABLE FIELD =====
function EditableField({ label, value, onSave, multiline = false, placeholder = "Click to edit...", helpText, badge }: {
    label: string; value: string; onSave: (val: string) => Promise<void>;
    multiline?: boolean; placeholder?: string; helpText?: string; badge?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    useEffect(() => { setTempValue(value || ''); }, [value]);

    const handleSave = async () => { await onSave(tempValue); setEditing(false); };

    if (editing) {
        return (
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    {label}
                    {badge && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">{badge}</span>}
                </label>
                {multiline ? (
                    <textarea value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={handleSave}
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" autoFocus />
                ) : (
                    <input type="text" value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
                )}
            </div>
        );
    }

    return (
        <div onClick={() => setEditing(true)} className="group cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                {label}
                {badge && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">{badge}</span>}
            </label>
            <div className="mt-1 text-sm text-slate-900 flex items-center justify-between">
                <span className={value ? '' : 'text-slate-400'}>{value || placeholder}</span>
                <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-4 h-4" /></span>
            </div>
        </div>
    );
}

// ===== TAGS INPUT =====
function TagsInput({ items = [], onAdd, onRemove, label, helpText }: {
    items: string[]; onAdd: (tag: string) => void; onRemove: (index: number) => void; label: string; helpText?: string;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => { if (newValue.trim()) { onAdd(newValue.trim()); setNewValue(''); setIsAdding(false); } };

    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">{label}</label>
            {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium flex items-center gap-1.5">
                        {item}
                        <button onClick={() => onRemove(i)} className="text-indigo-600 hover:text-indigo-800"><X className="w-3 h-3" /></button>
                    </span>
                ))}
                {isAdding ? (
                    <input value={newValue} onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
                        onBlur={handleAdd} className="w-32 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus placeholder="Add..." />
                ) : (
                    <button onClick={() => setIsAdding(true)} className="px-3 py-1.5 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg text-sm hover:border-indigo-400 hover:text-indigo-600">+ Add</button>
                )}
            </div>
        </div>
    );
}

// ===== TOGGLE =====
function Toggle({ value, onChange, label, helpText }: { value: boolean; onChange: (val: boolean) => void; label: string; helpText?: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <label className="text-sm font-medium text-slate-700">{label}</label>
                {helpText && <p className="text-xs text-slate-500 mt-0.5">{helpText}</p>}
            </div>
            <button onClick={() => onChange(!value)} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", value ? "bg-indigo-600" : "bg-slate-200")}>
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm", value ? "translate-x-6" : "translate-x-1")} />
            </button>
        </div>
    );
}

// ===== SELECT FIELD =====
function SelectField({ label, value, options, onChange, helpText, placeholder = "Select..." }: {
    label: string; value: string; options: { value: string; label: string }[]; onChange: (val: string) => void; helpText?: string; placeholder?: string;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">{label}</label>
            {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
            <div className="relative">
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
                    value={value || ''} onChange={(e) => onChange(e.target.value)}>
                    <option value="">{placeholder}</option>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}

// ===== MULTI-SELECT =====
function MultiSelectField({ label, values, options, onChange, helpText }: {
    label: string; values: string[]; options: { value: string; label: string }[]; onChange: (vals: string[]) => void; helpText?: string;
}) {
    const toggleOption = (optValue: string) => {
        const next = values.includes(optValue) ? values.filter(v => v !== optValue) : [...values, optValue];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">{label}</label>
            {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button key={opt.value} onClick={() => toggleOption(opt.value)}
                        className={cn("px-3 py-1.5 text-sm rounded-lg border transition-colors",
                            values.includes(opt.value) ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ===== SCHEDULE DISPLAY =====
function ScheduleDisplay({ value, label }: { value: any; label: string }) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const isStructured = value && typeof value === 'object' && !Array.isArray(value);

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex justify-between items-start mb-2">
                <label className="text-xs font-medium text-slate-500">{label}</label>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Edit</button>
            </div>
            {isStructured ? (
                <div className="space-y-1">
                    {dayOrder.map(day => {
                        const schedule = value[day];
                        if (!schedule) return null;
                        const isOpen = schedule.isOpen !== false && (schedule.open || schedule.openTime);
                        return (
                            <div key={day} className="flex justify-between text-sm">
                                <span className="text-slate-600 capitalize w-24">{day}</span>
                                <span className={isOpen ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                                    {isOpen ? `${schedule.openTime || schedule.open} - ${schedule.closeTime || schedule.close}` : 'Closed'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-sm text-slate-500 italic">{typeof value === 'string' ? value : 'No schedule configured'}</div>
            )}
        </div>
    );
}

// ===== FAQ LIST =====
function FAQList({ faqs, label }: { faqs: { question: string; answer: string }[]; label: string }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">{label}</label>
            {faqs.length > 0 ? (
                <div className="space-y-2">
                    {faqs.map((faq, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-200">
                            <div className="font-medium text-slate-900">{faq.question}</div>
                            <div className="text-slate-600 mt-1">{faq.answer}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500">No FAQs configured yet</div>
            )}
        </div>
    );
}

// ===== FROM THE WEB SECTION =====
function FromTheWebSection({ items, onDelete, onToggleAI, onImportData }: {
    items: UnmappedDataItem[]; onDelete: (id: string) => void; onToggleAI: (id: string, enabled: boolean) => void; onImportData?: () => void;
}) {
    const [filter, setFilter] = useState<'all' | 'mapped' | 'unmapped' | 'google' | 'website'>('all');

    const filtered = items.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'mapped') return !!item.suggestedMapping;
        if (filter === 'unmapped') return !item.suggestedMapping;
        return item.source === filter;
    });

    const mappedCount = items.filter(i => i.suggestedMapping).length;

    if (items.length === 0) {
        return (
            <div className="text-center py-8">
                <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm">No imported data yet</p>
                <p className="text-slate-400 text-xs mt-1">Use Import Center to fetch from Google or your website</p>
                {onImportData && (
                    <button onClick={onImportData} className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700">
                        Go to Import Center
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(['all', 'mapped', 'unmapped', 'google', 'website'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                filter === f ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            {f === 'all' && ` (${items.length})`}
                            {f === 'mapped' && ` (${mappedCount})`}
                        </button>
                    ))}
                </div>
                <button className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-xs font-medium hover:bg-pink-700 flex items-center gap-1.5">
                    <Bot className="w-3 h-3" /> AI Map All
                </button>
            </div>

            <div className="space-y-2">
                {filtered.map(item => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 group hover:border-pink-300 transition-all">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold text-sm text-slate-900">{item.key}</span>
                                    <span className={cn("text-xs px-1.5 py-0.5 rounded", item.source === 'google' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
                                        {item.source === 'google' ? '🔍 Google' : '🌐 Website'}
                                    </span>
                                    {item.usedByAI && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ AI Context</span>}
                                    {item.suggestedMapping && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">🎯 Mapping suggested</span>}
                                </div>
                                <p className="text-sm text-slate-700">{item.value}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs text-slate-400">Imported: {new Date(item.importedAt).toLocaleDateString()}</span>
                                    {item.suggestedMapping && (
                                        <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1">Map to: {item.suggestedMapping} →</button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Map to field"><Target className="w-4 h-4" /></button>
                                <button onClick={() => onToggleAI(item.id, !item.usedByAI)}
                                    className={cn("p-2 rounded-lg", item.usedByAI ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-slate-400 hover:text-green-600 hover:bg-green-50")}
                                    title={item.usedByAI ? "Disable AI usage" : "Enable AI usage"}>
                                    {item.usedByAI ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                <p className="text-xs text-pink-800 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    All data here enriches AI agent responses, even without explicit field mapping. Items marked "AI Context" are actively used.
                </p>
            </div>
        </div>
    );
}

// ===== SCHEMA FIELD RENDERER =====
function SchemaField({ field, value, onChange, onTagsAdd, onTagsRemove }: {
    field: FieldConfig; value: any; onChange: (val: any) => Promise<void>; onTagsAdd: (tag: string) => void; onTagsRemove: (idx: number) => void;
}) {
    switch (field.type) {
        case 'toggle': return <Toggle value={!!value} onChange={onChange} label={field.label} helpText={field.helpText} />;
        case 'tags': return <TagsInput items={Array.isArray(value) ? value : []} onAdd={onTagsAdd} onRemove={onTagsRemove} label={field.label} helpText={field.helpText} />;
        case 'select': return <SelectField label={field.label} value={value || ''} options={field.options || []} onChange={onChange} helpText={field.helpText} placeholder={field.placeholder} />;
        case 'multi-select': case 'checkbox-group': return <MultiSelectField label={field.label} values={Array.isArray(value) ? value : []} options={field.options || []} onChange={onChange} helpText={field.helpText} />;
        case 'schedule': return <ScheduleDisplay value={value} label={field.label} />;
        case 'faq-list': return <FAQList faqs={Array.isArray(value) ? value : []} label={field.label} />;
        case 'textarea': return <EditableField label={field.label} value={typeof value === 'string' ? value : ''} onSave={onChange} multiline={true} placeholder={field.placeholder} helpText={field.helpText} badge={field.validation?.required ? 'Required' : undefined} />;
        default: return <EditableField label={field.label} value={typeof value === 'string' ? value : (value?.toString() || '')} onSave={onChange} placeholder={field.placeholder} helpText={field.helpText} badge={field.validation?.required ? 'Required' : undefined} />;
    }
}

// ===== AI INSIGHTS PANEL =====
function AIInsightsPanel({ insights, onAction }: { insights: AIInsight[]; onAction: (insight: AIInsight) => void }) {
    const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

    const getInsightColors = (type: AIInsight['type']) => ({
        critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-700', btn: 'bg-red-600 hover:bg-red-700' },
        improvement: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
        opportunity: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700', btn: 'bg-green-600 hover:bg-green-700' },
        data_quality: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' },
        mapping: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' },
        sync: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    })[type];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        <div>
                            <h3 className="font-bold">AI Insights</h3>
                            <p className="text-xs text-indigo-200">Profile improvements</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">{insights.length}</span>
                </div>
            </div>

            <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {insights.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                        <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">Looking good! No issues found.</p>
                    </div>
                ) : insights.map(insight => {
                    const colors = getInsightColors(insight.type);
                    const isExpanded = expandedInsight === insight.id;

                    return (
                        <div key={insight.id} className={cn("rounded-xl border overflow-hidden", colors.border, colors.bg)}>
                            <button onClick={() => setExpandedInsight(isExpanded ? null : insight.id)} className="w-full p-3 text-left">
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">{insight.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={cn("font-semibold text-sm", colors.text)}>{insight.title}</span>
                                            <span className={cn("text-xs px-1.5 py-0.5 rounded-full", colors.badge)}>{insight.impact}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{insight.description}</p>
                                    </div>
                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-3 pb-3">
                                    <div className="ml-7 space-y-2">
                                        {insight.suggestion && (
                                            <div className="p-2 bg-white/80 rounded-lg border border-slate-200">
                                                <div className="text-xs font-semibold text-slate-500 mb-1">💡 AI Suggestion</div>
                                                <p className="text-xs text-slate-700">{insight.suggestion}</p>
                                            </div>
                                        )}
                                        {insight.autoFill && (
                                            <div className="p-2 bg-green-100/50 rounded-lg border border-green-200">
                                                <div className="text-xs font-semibold text-green-700 mb-1">✨ One-click add</div>
                                                <p className="text-xs text-green-800">"{insight.autoFill.value}"</p>
                                            </div>
                                        )}
                                        <button onClick={() => onAction(insight)} className={cn("w-full py-2 rounded-lg text-xs font-semibold text-white", colors.btn)}>
                                            {insight.action}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ===== IMPORT CENTER DRAWER =====
function ImportCenterDrawer({ isOpen, onClose, importHistory, onImportGoogle, onImportWebsite }: {
    isOpen: boolean; onClose: () => void; importHistory: ImportRecord[];
    onImportGoogle?: () => void; onImportWebsite?: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
            <div className="w-full max-w-lg bg-white h-full overflow-hidden flex flex-col shadow-2xl">
                <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold">Import Center</h2>
                            <p className="text-blue-200 text-sm">Manage data sources & sync history</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={onImportGoogle} className="p-4 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/20 transition-all">
                            <div className="flex items-center gap-2 mb-1">
                                <Search className="w-5 h-5" />
                                <span className="font-semibold text-sm">Google Places</span>
                            </div>
                            <div className="text-xs text-blue-200">Import from Google</div>
                        </button>
                        <button onClick={onImportWebsite} className="p-4 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/20 transition-all">
                            <div className="flex items-center gap-2 mb-1">
                                <Globe className="w-5 h-5" />
                                <span className="font-semibold text-sm">Website</span>
                            </div>
                            <div className="text-xs text-blue-200">Scrape your website</div>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Import History</h3>
                        {importHistory.length > 0 ? (
                            <div className="space-y-2">
                                {importHistory.slice(0, 10).map(imp => (
                                    <div key={imp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                                                {imp.source === 'google' ? <Search className="w-4 h-4 text-blue-600" /> : <Globe className="w-4 h-4 text-purple-600" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-slate-900">{imp.sourceIdentifier}</div>
                                                <div className="text-xs text-slate-500">{imp.fieldsCount} fields • {new Date(imp.importedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <span className={cn("text-xs px-2 py-0.5 rounded-full", imp.status === 'applied' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                                            {imp.status === 'applied' ? 'Applied' : 'Partial'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <Download className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No imports yet</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Auto-Sync Settings</h3>
                        <div className="space-y-2">
                            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100">
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4 text-slate-500" />
                                    <div>
                                        <div className="font-medium text-sm text-slate-900">Google Auto-Sync</div>
                                        <div className="text-xs text-slate-500">Check weekly for updates</div>
                                    </div>
                                </div>
                                <div className="w-11 h-6 bg-slate-300 rounded-full relative">
                                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow"></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== IMPORT SOURCES CARD =====
function ImportSourcesCard({ importHistory, onOpenImportCenter }: { importHistory: ImportRecord[]; onOpenImportCenter: () => void }) {
    const lastGoogle = importHistory.find(h => h.source === 'google');
    const lastWebsite = importHistory.find(h => h.source === 'website');

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Download className="w-4 h-4" /> Import Sources</h3>
            <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        <div>
                            <div className="font-medium text-sm">Google Places</div>
                            <div className="text-xs text-slate-500">{lastGoogle ? new Date(lastGoogle.importedAt).toLocaleDateString() : 'Never'}</div>
                        </div>
                    </div>
                    <button onClick={onOpenImportCenter} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-200 font-medium">Sync</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-purple-600" />
                        <div>
                            <div className="font-medium text-sm">Website</div>
                            <div className="text-xs text-slate-500">{lastWebsite ? new Date(lastWebsite.importedAt).toLocaleDateString() : 'Never'}</div>
                        </div>
                    </div>
                    <button onClick={onOpenImportCenter} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg hover:bg-purple-200 font-medium">Sync</button>
                </div>
            </div>
        </div>
    );
}

// ===== MAIN COMPONENT =====
export default function SchemaBusinessProfile({ persona, onUpdate, onPreviewAI, onProcessAI, onModulesGenerated, onImportData, onClearAll }: SchemaBusinessProfileProps) {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>((persona.identity as any)?.country || 'GLOBAL');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showImportDrawer, setShowImportDrawer] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');

    const selectedCategories: SelectedBusinessCategory[] = useMemo(() =>
        (persona.identity as any)?.businessCategories || EMPTY_CATEGORIES,
        [(persona.identity as any)?.businessCategories]
    );

    const [pendingSelections, setPendingSelections] = useState<string[]>(selectedCategories.map(c => c.functionId));

    const hasSelectedCategories = selectedCategories.length > 0;
    const industries = getIndustries();

    const sections = useMemo(() => {
        const baseSections = [...BUSINESS_PROFILE_CONFIG.sections];
        const expertiseSchema = getExpertiseSections(selectedCategories, selectedCountry);

        if (expertiseSchema.sections.length > 0) {
            const expertiseSection: SectionConfig = {
                id: 'expertise', title: 'Expertise & Specializations', icon: '⭐',
                description: 'Function-specific details across your business categories',
                industrySpecific: true, subSections: expertiseSchema.sections,
            };
            baseSections.splice(2, 0, expertiseSection);
        }
        return baseSections;
    }, [selectedCategories, selectedCountry]);

    useEffect(() => {
        if (showCategoryModal) { setPendingSelections(selectedCategories.map(c => c.functionId)); setCategorySearch(''); }
    }, [showCategoryModal]);

    const importMeta = useMemo(() => (persona as any)?._importMeta as ImportMeta | undefined, [persona]);
    const unmappedData = useMemo(() => importMeta?.unmappedData || [], [importMeta]);
    const importHistory = useMemo(() => importMeta?.history || [], [importMeta]);

    const handleDeleteUnmappedItem = async (itemId: string) => {
        await onUpdate('_importMeta.unmappedData', unmappedData.filter(d => d.id !== itemId));
    };

    const handleToggleAIUsage = async (itemId: string, enabled: boolean) => {
        await onUpdate('_importMeta.unmappedData', unmappedData.map(d => d.id === itemId ? { ...d, usedByAI: enabled } : d));
    };

    const get = (path: string, def: any = '') => {
        const keys = path.split('.');
        let current: any = persona;
        for (const key of keys) { if (current === undefined || current === null) return def; current = current[key]; }
        return current !== undefined && current !== null ? current : def;
    };

    const handleTagsAdd = (path: string, currentTags: string[]) => async (tag: string) => { await onUpdate(path, [...currentTags, tag]); };
    const handleTagsRemove = (path: string, currentTags: string[]) => async (index: number) => { const next = [...currentTags]; next.splice(index, 1); await onUpdate(path, next); };

    const name = get('identity.name');
    const tagline = get('personality.tagline');
    const score = get('setupProgress.overallPercentage', 0);

    // Generate AI insights
    const aiInsights: AIInsight[] = useMemo(() => {
        const insights: AIInsight[] = [];
        if (!get('identity.operatingHours.schedule') && !get('identity.operatingHours.isOpen24x7')) {
            insights.push({ id: 'missing-hours', type: 'critical', icon: '🚨', title: 'Missing Business Hours', description: 'Operating hours not set. This is the #1 customer question.', impact: 'High', section: 'location-hours', suggestion: 'Set your regular business hours so customers know when you\'re available.', action: 'Set Hours' });
        }
        if (!get('personality.description') || get('personality.description', '').length < 50) {
            insights.push({ id: 'short-description', type: 'data_quality', icon: '🔍', title: 'Description Too Short', description: 'Your business description should be 50-100 words for richer AI responses.', impact: 'Medium', section: 'brand-identity', suggestion: 'Include: founding story, what you offer, and what makes you unique.', action: 'Expand Description' });
        }
        const mappableItems = unmappedData.filter(d => d.suggestedMapping);
        if (mappableItems.length > 0) {
            insights.push({ id: 'unmapped-data', type: 'mapping', icon: '🎯', title: 'Unmapped Data Available', description: `${mappableItems.length} items in "From the Web" have suggested field mappings.`, impact: 'Medium', section: 'from-the-web', action: 'Review Mappings' });
        }
        if (importHistory.length > 0) {
            const daysSinceImport = Math.floor((Date.now() - new Date(importHistory[0].importedAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceImport > 7) {
                insights.push({ id: 'sync-needed', type: 'sync', icon: '🔄', title: 'Data May Be Outdated', description: `Last import was ${daysSinceImport} days ago. Consider syncing for latest data.`, impact: 'Low', action: 'Sync Now' });
            }
        }
        return insights;
    }, [persona, unmappedData, importHistory]);

    const handleInsightAction = (insight: AIInsight) => {
        if (insight.autoFill) { onUpdate(insight.autoFill.path, insight.autoFill.value); }
        else if (insight.action === 'Sync Now') { setShowImportDrawer(true); }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Hero Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-lg border border-white/20">{name?.[0] || 'B'}</div>
                            <div>
                                <h1 className="text-2xl font-bold">{name || 'Your Business Name'}</h1>
                                <p className="text-indigo-200">{tagline || 'Add a tagline...'}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {selectedCategories.slice(0, 3).map((cat, idx) => (
                                        <span key={cat.functionId} className={cn("px-2.5 py-1 rounded-lg text-xs font-medium", idx === 0 ? "bg-white text-indigo-600" : "bg-white/20")}>
                                            {cat.label} {idx === 0 && '(Primary)'}
                                        </span>
                                    ))}
                                    {selectedCategories.length > 3 && <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-medium">+{selectedCategories.length - 3} more</span>}
                                    <button onClick={() => setShowCategoryModal(true)} className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
                                        {selectedCategories.length > 0 ? <><Edit3 className="w-3 h-3" /> Edit</> : '+ Select Categories'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <ProgressRing value={score} />
                            <div className="text-xs text-indigo-200">
                                {score < 100 ? <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {100 - score}% to go!</span> : <span>🎉 Profile complete!</span>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3 flex-wrap">
                        <button onClick={() => setShowImportDrawer(true)} className="px-4 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-50 flex items-center gap-2 shadow-md transition-colors">
                            <Download className="w-4 h-4" /> Import Center
                            {importHistory.length > 0 && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">{importHistory.length}</span>}
                        </button>
                        {onPreviewAI && <button onClick={onPreviewAI} className="px-4 py-2.5 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 flex items-center gap-2 transition-colors"><Eye className="w-4 h-4" /> Preview AI</button>}
                        {onProcessAI && <button onClick={onProcessAI} className="px-4 py-2.5 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 flex items-center gap-2 transition-colors"><Zap className="w-4 h-4" /> Process for AI</button>}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {!hasSelectedCategories ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center shadow-sm">
                                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Building2 className="w-8 h-8 text-indigo-600" /></div>
                                <p className="text-lg font-semibold mb-2 text-slate-700">Select your business categories to unlock profile editing</p>
                                <p className="text-sm text-slate-500 mb-4">This helps us tailor the profile fields and AI suggestions to your industry.</p>
                                <button onClick={() => setShowCategoryModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 mx-auto">
                                    <Plus className="w-4 h-4" /> Select Categories
                                </button>
                            </div>
                        ) : (
                            <>
                                {selectedCategories.length > 0 && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🏷️</span>
                                                <span className="font-medium text-emerald-900">Active Categories:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedCategories.map((cat, idx) => (
                                                        <span key={cat.functionId} className={cn("px-2 py-0.5 rounded text-xs font-medium", idx === 0 ? "bg-indigo-600 text-white" : "bg-white border border-indigo-200 text-indigo-700")}>
                                                            {cat.label} {idx === 0 && '(Primary)'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            {onClearAll && <button onClick={onClearAll} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Clear All</button>}
                                        </div>
                                    </div>
                                )}

                                {sections.map((section: SectionConfig, idx: number) => {
                                    const Icon = SECTION_ICONS[section.id] || Building2;
                                    const bg = SECTION_COLORS[section.id] || 'bg-slate-500';

                                    if (section.id === 'from-the-web') {
                                        return (
                                            <Section key={section.id} title={section.title} icon={Icon} iconBg={bg} defaultOpen={unmappedData.length > 0}
                                                description={section.description} badge={unmappedData.length > 0 ? `${unmappedData.length} items` : undefined} isWebData={true}>
                                                <FromTheWebSection items={unmappedData} onDelete={handleDeleteUnmappedItem} onToggleAI={handleToggleAIUsage} onImportData={() => setShowImportDrawer(true)} />
                                            </Section>
                                        );
                                    }

                                    return (
                                        <Section key={section.id} title={section.title} icon={Icon} iconBg={bg} defaultOpen={idx === 0}
                                            description={section.description} industrySpecific={section.industrySpecific}>
                                            <div className="pt-4 space-y-6">
                                                {section.subSections?.map((subSection: any) => {
                                                    const SubIcon = SUBSECTION_ICONS[subSection.id] || Building2;
                                                    return (
                                                        <div key={subSection.id} className="space-y-3">
                                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                                <div className="flex items-center gap-2">
                                                                    <SubIcon className="w-4 h-4 text-slate-500" />
                                                                    <h4 className="font-medium text-slate-800">{subSection.title}</h4>
                                                                </div>
                                                                <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Suggest</button>
                                                            </div>
                                                            <div className={cn("grid gap-3", subSection.fields?.length > 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                                                                {subSection.fields?.map((field: FieldConfig) => {
                                                                    const value = get(field.schemaPath);
                                                                    const currentTags = Array.isArray(value) ? value : [];
                                                                    return (
                                                                        <div key={field.key} className={cn(field.gridSpan === 2 && "md:col-span-2")}>
                                                                            <SchemaField field={field} value={value} onChange={(val) => onUpdate(field.schemaPath, val)}
                                                                                onTagsAdd={handleTagsAdd(field.schemaPath, currentTags)} onTagsRemove={handleTagsRemove(field.schemaPath, currentTags)} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Section>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    <div className="space-y-6">
                        <AIInsightsPanel insights={aiInsights} onAction={handleInsightAction} />
                        <ImportSourcesCard importHistory={importHistory} onOpenImportCenter={() => setShowImportDrawer(true)} />
                    </div>
                </div>

                <ImportCenterDrawer isOpen={showImportDrawer} onClose={() => setShowImportDrawer(false)} importHistory={importHistory}
                    onImportGoogle={onImportData} onImportWebsite={onImportData} />

                {/* Category Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">Select Business Categories</h3>
                                        <p className="text-xs text-slate-500">Choose one or more categories. This tailors your profile fields and AI suggestions.</p>
                                    </div>
                                    <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Search business categories..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                                    </div>
                                    <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                                        className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                        {getCountriesForDropdown().map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex">
                                <div className="w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50/50 p-2">
                                    {industries.map(industry => {
                                        const isSelected = selectedIndustry === industry.industryId;
                                        const IconComponent = CATEGORY_ICONS[industry.iconName] || Building2;
                                        return (
                                            <button key={industry.industryId} onClick={() => setSelectedIndustry(industry.industryId)}
                                                className={cn("w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all mb-1.5 flex items-center justify-between",
                                                    isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-700 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100")}>
                                                <span className="flex items-center gap-3">
                                                    <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isSelected ? "bg-white/20" : "bg-indigo-100")}>
                                                        <IconComponent className={cn("w-4 h-4", isSelected ? "text-white" : "text-indigo-700")} />
                                                    </span>
                                                    <span className="truncate">{industry.name}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 bg-white">
                                    {(() => {
                                        let functionsToShow: ResolvedFunction[] = [];
                                        if (categorySearch.trim()) { functionsToShow = searchFunctions(categorySearch, selectedCountry); }
                                        else if (selectedIndustry) { functionsToShow = getResolvedFunctions(selectedIndustry, selectedCountry); }

                                        if (functionsToShow.length > 0) {
                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {functionsToShow.map((func) => {
                                                        const isSelected = pendingSelections.includes(func.functionId);
                                                        return (
                                                            <button key={func.functionId}
                                                                onClick={() => setPendingSelections(prev => isSelected ? prev.filter(id => id !== func.functionId) : [...prev, func.functionId])}
                                                                className={cn("text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                                                                    isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50")}>
                                                                <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0", isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300")}>
                                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={cn("text-sm font-medium", isSelected ? "text-indigo-700" : "text-slate-700")}>{func.displayLabel}</div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }
                                        return <div className="text-center py-12 text-slate-500"><Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>Select an industry to see business functions</p></div>;
                                    })()}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="text-sm text-slate-500">{pendingSelections.length > 0 ? `${pendingSelections.length} categor${pendingSelections.length === 1 ? 'y' : 'ies'} selected` : 'Select at least one category'}</div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                                    <button disabled={pendingSelections.length === 0}
                                        onClick={async () => {
                                            const categories = toSelectedCategories(pendingSelections, selectedCountry);
                                            await onUpdate('identity.businessCategories', categories);
                                            await onUpdate('identity.country', selectedCountry);
                                            if (categories.length > 0) {
                                                const firstInfo = findFunctionInfo(categories[0].functionId, selectedCountry);
                                                if (firstInfo) { await onUpdate('identity.industry', { category: categories.map(c => c.industryId), functions: categories.map(c => c.functionId) }); }
                                                if (onModulesGenerated) {
                                                    const modulesResult = await generateModulesFromCategories(categories.map(c => ({ functionId: c.functionId, industryId: c.industryId })), selectedCountry);
                                                    if (modulesResult.success && modulesResult.config) { await onModulesGenerated(modulesResult.config); }
                                                }
                                            }
                                            setShowCategoryModal(false);
                                        }}
                                        className={cn("px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
                                            pendingSelections.length > 0 ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-200 text-slate-400 cursor-not-allowed")}>
                                        Save Categories
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
