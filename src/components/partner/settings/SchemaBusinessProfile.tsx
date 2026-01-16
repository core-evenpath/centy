'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, MapPin, Target, Shield, Globe, ChevronDown,
    Edit3, Check, X, Plus, Sparkles, Search, Eye, Award,
    Phone, Clock, HelpCircle, Bot, Zap,
    LucideIcon, Landmark, GraduationCap, Heart, Briefcase,
    ShoppingBag, UtensilsCrossed, ShoppingCart, Car, Plane,
    PartyPopper, Wrench, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona } from '@/lib/business-persona-types';
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
    Landmark,
    GraduationCap,
    Heart,
    Briefcase,
    ShoppingBag,
    UtensilsCrossed,
    ShoppingCart,
    Sparkles,
    Car,
    Plane,
    Building: Building2,
    PartyPopper,
    Wrench,
    MoreHorizontal,
};

const EMPTY_CATEGORIES: any[] = [];

// ===== PROPS =====
interface SchemaBusinessProfileProps {
    persona: Partial<BusinessPersona>;
    onUpdate: (path: string, value: any) => Promise<void>;
    onPreviewAI?: () => void;
    onProcessAI?: () => Promise<void>;
    // Module generation callback
    onModulesGenerated?: (config: ModulesConfig) => Promise<void>;
}

// ===== PROGRESS RING =====
function ProgressRing({ value }: { value: number }) {
    const radius = 54;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative w-32 h-32">
            <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
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
    title,
    icon: Icon,
    iconBg,
    children,
    defaultOpen = false,
    description
}: {
    title: string;
    icon: LucideIcon;
    iconBg: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    description?: string;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                </div>
                <ChevronDown className={cn(
                    "w-5 h-5 text-slate-400 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>
            {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                    {children}
                </div>
            )}
        </div>
    );
}

// ===== EDITABLE FIELD =====
function EditableField({
    label,
    value,
    onSave,
    multiline = false,
    placeholder = "Click to add...",
    helpText,
    badge
}: {
    label: string;
    value: string;
    onSave: (val: string) => Promise<void>;
    multiline?: boolean;
    placeholder?: string;
    helpText?: string;
    badge?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    useEffect(() => {
        setTempValue(value || '');
    }, [value]);

    const handleSave = async () => {
        await onSave(tempValue);
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setTempValue(value || '');
            setEditing(false);
        }
    };

    return (
        <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
                {badge && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-medium rounded">{badge}</span>}
            </div>
            {helpText && <p className="text-xs text-slate-400 mb-1">{helpText}</p>}

            {editing ? (
                <div className="flex items-start gap-2">
                    {multiline ? (
                        <textarea
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            autoFocus
                        />
                    ) : (
                        <input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                    )}
                    <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setTempValue(value || ''); setEditing(false); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => setEditing(true)}
                    className="px-3 py-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 flex items-center justify-between group min-h-[38px]"
                >
                    <span className={cn("text-sm whitespace-pre-wrap", value ? 'text-slate-700' : 'text-slate-400 italic')}>
                        {value || placeholder}
                    </span>
                    <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2" />
                </div>
            )}
        </div>
    );
}

// ===== TAGS INPUT =====
function TagsInput({
    items = [],
    onAdd,
    onRemove,
    label,
    helpText
}: {
    items: string[];
    onAdd: (tag: string) => void;
    onRemove: (index: number) => void;
    label: string;
    helpText?: string;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (newValue.trim()) {
            onAdd(newValue.trim());
            setNewValue('');
            setIsAdding(false);
        }
    };

    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">{label}</label>
            {helpText && <p className="text-xs text-slate-400 mb-2">{helpText}</p>}
            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <span key={i} className="px-3 py-1 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
                        {item}
                        <button onClick={() => onRemove(i)} className="hover:bg-indigo-100 rounded-full p-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {isAdding ? (
                    <input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
                        onBlur={handleAdd}
                        className="w-32 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        placeholder="Add..."
                    />
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add
                    </button>
                )}
            </div>
        </div>
    );
}

// ===== TOGGLE =====
function Toggle({ value, onChange, label, helpText }: { value: boolean; onChange: (val: boolean) => void; label: string; helpText?: string }) {
    return (
        <div className="flex items-center justify-between py-2 mb-3">
            <div>
                <label className="text-sm font-medium text-slate-700">{label}</label>
                {helpText && <p className="text-xs text-slate-500 mt-0.5">{helpText}</p>}
            </div>
            <button
                onClick={() => onChange(!value)}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    value ? "bg-indigo-600" : "bg-slate-200"
                )}
            >
                <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    value ? "translate-x-6" : "translate-x-1"
                )} />
            </button>
        </div>
    );
}

// ===== SELECT =====
function SelectField({
    label,
    value,
    options,
    onChange,
    helpText,
    placeholder = "Select..."
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    helpText?: string;
    placeholder?: string;
}) {
    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
            {helpText && <p className="text-xs text-slate-400 mb-1">{helpText}</p>}
            <div className="relative">
                <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">{placeholder}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}

// ===== MULTI-SELECT =====
function MultiSelectField({
    label,
    values,
    options,
    onChange,
    helpText
}: {
    label: string;
    values: string[];
    options: { value: string; label: string }[];
    onChange: (vals: string[]) => void;
    helpText?: string;
}) {
    const toggleOption = (optValue: string) => {
        const isSelected = values.includes(optValue);
        const next = isSelected
            ? values.filter(v => v !== optValue)
            : [...values, optValue];
        onChange(next);
    };

    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
            {helpText && <p className="text-xs text-slate-400 mb-2">{helpText}</p>}
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const isSelected = values.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => toggleOption(opt.value)}
                            className={cn(
                                "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                                isSelected
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ===== SCHEDULE DISPLAY =====
function ScheduleDisplay({ value, label }: { value: any; label: string }) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const isStructured = value && typeof value === 'object' && !Array.isArray(value);

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
            <div className="flex justify-between items-start mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase block">{label}</label>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Edit</button>
            </div>
            {isStructured ? (
                <div className="space-y-1">
                    {dayOrder.map(day => {
                        const schedule = value[day];
                        if (!schedule) return null;
                        const isOpen = schedule.isOpen !== false && (schedule.open || schedule.openTime);
                        const openTime = schedule.openTime || schedule.open || '';
                        const closeTime = schedule.closeTime || schedule.close || '';
                        return (
                            <div key={day} className="flex justify-between text-sm">
                                <span className="text-slate-600 capitalize w-24">{day}</span>
                                <span className={isOpen ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                                    {isOpen ? `${openTime} - ${closeTime}` : 'Closed'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-sm text-slate-500 italic">
                    {typeof value === 'string' ? value : 'No schedule configured'}
                </div>
            )}
        </div>
    );
}

// ===== FAQ LIST =====
function FAQList({ faqs, label }: { faqs: { question: string; answer: string }[]; label: string }) {
    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">{label}</label>
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
                <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500">
                    No FAQs configured yet
                </div>
            )}
        </div>
    );
}

// ===== SCHEMA FIELD RENDERER =====
function SchemaField({
    field,
    value,
    onChange,
    onTagsAdd,
    onTagsRemove
}: {
    field: FieldConfig;
    value: any;
    onChange: (val: any) => Promise<void>;
    onTagsAdd: (tag: string) => void;
    onTagsRemove: (idx: number) => void;
}) {
    switch (field.type) {
        case 'toggle':
            return <Toggle value={!!value} onChange={onChange} label={field.label} helpText={field.helpText} />;

        case 'tags':
            return (
                <TagsInput
                    items={Array.isArray(value) ? value : []}
                    onAdd={onTagsAdd}
                    onRemove={onTagsRemove}
                    label={field.label}
                    helpText={field.helpText}
                />
            );

        case 'select':
            return (
                <SelectField
                    label={field.label}
                    value={value || ''}
                    options={field.options || []}
                    onChange={onChange}
                    helpText={field.helpText}
                    placeholder={field.placeholder}
                />
            );

        case 'multi-select':
        case 'checkbox-group':
            return (
                <MultiSelectField
                    label={field.label}
                    values={Array.isArray(value) ? value : []}
                    options={field.options || []}
                    onChange={onChange}
                    helpText={field.helpText}
                />
            );

        case 'schedule':
            return <ScheduleDisplay value={value} label={field.label} />;

        case 'faq-list':
            return <FAQList faqs={Array.isArray(value) ? value : []} label={field.label} />;

        case 'textarea':
            return (
                <EditableField
                    label={field.label}
                    value={typeof value === 'string' ? value : ''}
                    onSave={onChange}
                    multiline={true}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                    badge={field.validation?.required ? 'Required' : undefined}
                />
            );

        default:
            return (
                <EditableField
                    label={field.label}
                    value={typeof value === 'string' ? value : (value?.toString() || '')}
                    onSave={onChange}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                    badge={field.validation?.required ? 'Required' : undefined}
                />
            );
    }
}

// ===== MAIN COMPONENT =====
export default function SchemaBusinessProfile({
    persona,
    onUpdate,
    onPreviewAI,
    onProcessAI,
    onModulesGenerated
}: SchemaBusinessProfileProps) {

    // Country selection for localized labels
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
        (persona.identity as any)?.country || 'GLOBAL'
    );

    // UI State for category modal
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');

    // Get currently selected categories from persona
    const selectedCategories: SelectedBusinessCategory[] = useMemo(() =>
        (persona.identity as any)?.businessCategories || EMPTY_CATEGORIES,
        [(persona.identity as any)?.businessCategories]
    );

    const [pendingSelections, setPendingSelections] = useState<string[]>(
        selectedCategories.map(c => c.functionId)
    );

    // Check if user has selected at least one category
    const hasSelectedCategories = selectedCategories.length > 0;

    // Get industries from taxonomy
    const industries = getIndustries();

    // Get the primary industry ID for schema sections
    const primaryIndustryId = useMemo(() => {
        if (selectedCategories.length > 0) {
            return selectedCategories[0].industryId;
        }
        // Fallback to persona industry category
        const category = (persona.identity as any)?.industry?.category;
        if (Array.isArray(category)) return category[0] || 'services';
        return category || 'services';
    }, [selectedCategories, persona.identity]);

    // Get profile sections based on industry/functions
    const sections = useMemo(() => {
        const baseSections = [...BUSINESS_PROFILE_CONFIG.sections];

        // Resolve expertise schema based on selected categories
        const expertiseSchema = getExpertiseSections(selectedCategories, selectedCountry);

        if (expertiseSchema.sections.length > 0) {
            const expertiseSection: SectionConfig = {
                id: 'expertise',
                title: 'Expertise & Specializations',
                icon: '⭐',
                description: 'Function-specific details across your business categories',
                industrySpecific: true,
                subSections: expertiseSchema.sections,
            };
            // Insert at position 2 (after Brand Identity and Location/Hours)
            baseSections.splice(2, 0, expertiseSection);
        }

        return baseSections;
    }, [selectedCategories, selectedCountry]);


    // Sync pending selections ONLY when modal opens
    useEffect(() => {
        if (showCategoryModal) {
            setPendingSelections(selectedCategories.map(c => c.functionId));
            setCategorySearch('');
        }
    }, [showCategoryModal]); // Only run when modal visibility changes

    // Helper to safely get nested values
    const get = (path: string, def: any = '') => {
        const keys = path.split('.');
        let current: any = persona;
        for (const key of keys) {
            if (current === undefined || current === null) return def;
            current = current[key];
        }
        return current !== undefined && current !== null ? current : def;
    };

    // Handler for tags operations
    const handleTagsAdd = (path: string, currentTags: string[]) => async (tag: string) => {
        await onUpdate(path, [...currentTags, tag]);
    };

    const handleTagsRemove = (path: string, currentTags: string[]) => async (index: number) => {
        const next = [...currentTags];
        next.splice(index, 1);
        await onUpdate(path, next);
    };

    // Data mapping
    const name = get('identity.name');
    const tagline = get('personality.tagline');
    const score = get('setupProgress.overallPercentage', 0);

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Business Profile</h1>
                        <p className="text-xs text-slate-500">Powers AI conversations & customer interactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {onPreviewAI && (
                            <button onClick={onPreviewAI} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Preview AI
                            </button>
                        )}
                        {onProcessAI && (
                            <button onClick={onProcessAI} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                                <Zap className="w-4 h-4" /> Process for AI
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Hero Header Card */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row items-start gap-8">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-3xl font-bold text-indigo-600 shadow-xl">
                                    {name?.[0] || 'B'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{name || 'Your Business Name'}</h2>
                                    <p className="text-indigo-200">{tagline || 'Add a tagline to describe your business'}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {/* Display selected categories as chips */}
                                        {selectedCategories.length > 0 ? (
                                            <>
                                                {selectedCategories.slice(0, 3).map(cat => (
                                                    <span
                                                        key={cat.functionId}
                                                        className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium"
                                                    >
                                                        {cat.label}
                                                    </span>
                                                ))}
                                                {selectedCategories.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                                                        +{selectedCategories.length - 3} more
                                                    </span>
                                                )}
                                            </>
                                        ) : null}
                                        <button
                                            onClick={() => setShowCategoryModal(true)}
                                            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 transition-colors rounded text-xs font-medium flex items-center gap-1"
                                        >
                                            {selectedCategories.length > 0 ? (
                                                <><Edit3 className="w-3 h-3" /> Edit</>
                                            ) : (
                                                <><Plus className="w-3 h-3" /> Select Categories</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center w-full md:w-auto flex flex-col items-center">
                            <ProgressRing value={score} />
                            <div className="mt-3 text-xs text-indigo-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {score < 100 ? 'Complete Profile' : 'AI Ready'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Show rest of UI only when categories are selected */}
                {hasSelectedCategories ? (
                    <>
                        {/* Business Type Display Banner - Read Only */}
                        {selectedCategories.length > 0 && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-900">Business Type</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCategories.map((cat, idx) => (
                                        <span
                                            key={cat.functionId}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium",
                                                idx === 0
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-white border border-indigo-200 text-indigo-700"
                                            )}
                                        >
                                            {cat.label}
                                            {idx === 0 && <span className="ml-1 text-indigo-200">(Primary)</span>}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-indigo-600 mt-2">
                                    Change your business type in the Business Category section above
                                </p>
                            </div>
                        )}

                        {/* Schema-Driven Sections */}
                        <div className="space-y-4">
                            {sections.map((section: SectionConfig, idx: number) => {
                                const Icon = SECTION_ICONS[section.id] || Building2;
                                const bg = SECTION_COLORS[section.id] || 'bg-slate-500';

                                return (
                                    <Section
                                        key={section.id}
                                        title={section.title}
                                        icon={Icon}
                                        iconBg={bg}
                                        defaultOpen={idx === 0}
                                        description={section.description}
                                    >
                                        <div className="space-y-6">
                                            {section.subSections.map((subSection: any) => (
                                                <div key={subSection.id} className="space-y-3">
                                                    {/* SubSection Header */}
                                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                                        {subSection.icon && <span className="text-lg">{subSection.icon}</span>}
                                                        <h4 className="font-medium text-slate-800">{subSection.title}</h4>
                                                    </div>

                                                    {/* Fields */}
                                                    <div className={cn(
                                                        "grid gap-4",
                                                        subSection.fields.length > 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                                                    )}>
                                                        {subSection.fields.map((field: FieldConfig) => {
                                                            const value = get(field.schemaPath);
                                                            const currentTags = Array.isArray(value) ? value : [];

                                                            return (
                                                                <div
                                                                    key={field.key}
                                                                    className={cn(field.gridSpan === 2 && "lg:col-span-2")}
                                                                >
                                                                    <SchemaField
                                                                        field={field}
                                                                        value={value}
                                                                        onChange={(val) => onUpdate(field.schemaPath, val)}
                                                                        onTagsAdd={handleTagsAdd(field.schemaPath, currentTags)}
                                                                        onTagsRemove={handleTagsRemove(field.schemaPath, currentTags)}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6 text-center shadow-sm">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                            <Building2 className="w-12 h-12 mb-4 text-indigo-400" />
                            <p className="text-lg font-semibold mb-2 text-slate-700">Select your business categories to unlock profile editing</p>
                            <p className="text-sm mb-4">This helps us tailor the profile fields and AI suggestions to your industry.</p>
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4" />
                                Select Categories
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Modal - Multi-Select with Country Localization */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Select Business Categories</h3>
                                    <p className="text-xs text-slate-500">
                                        Choose one or more categories that describe your business
                                        {pendingSelections.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                                {pendingSelections.length} selected
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-200 rounded-full">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            {/* Country selector and Search */}
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                                        className="pl-10 pr-8 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer"
                                    >
                                        {getCountriesForDropdown().map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.name}{c.hasOverrides ? ' ✦' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={categorySearch}
                                        onChange={(e) => setCategorySearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                    {categorySearch && (
                                        <button
                                            onClick={() => setCategorySearch('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        >
                                            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Left: Industries */}
                            <div className="w-full md:w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50/50 p-2">
                                {industries.map(industry => {
                                    const functionsInIndustry = getResolvedFunctions(industry.industryId, selectedCountry);
                                    const selectedInIndustry = functionsInIndustry.filter(f =>
                                        pendingSelections.includes(f.functionId)
                                    ).length;

                                    const IconComponent = CATEGORY_ICONS[industry.iconName] || Building2;

                                    return (
                                        <button
                                            key={industry.industryId}
                                            onClick={() => setSelectedIndustry(industry.industryId)}
                                            className={cn(
                                                "w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all mb-1.5 flex items-center justify-between",
                                                selectedIndustry === industry.industryId
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                    : "text-slate-700 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100"
                                            )}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    selectedIndustry === industry.industryId
                                                        ? "bg-white/20"
                                                        : "bg-slate-100"
                                                )}>
                                                    <IconComponent className={cn(
                                                        "w-4 h-4",
                                                        selectedIndustry === industry.industryId
                                                            ? "text-white"
                                                            : "text-slate-500"
                                                    )} />
                                                </span>
                                                <span className="truncate">{industry.name}</span>
                                            </span>
                                            {selectedInIndustry > 0 && (
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0",
                                                    selectedIndustry === industry.industryId
                                                        ? "bg-white/20 text-white"
                                                        : "bg-indigo-100 text-indigo-700"
                                                )}>
                                                    {selectedInIndustry}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right: Business Functions with Checkboxes */}
                            <div className="w-full md:w-2/3 overflow-y-auto p-4 bg-white">
                                {(() => {
                                    let functionsToShow: ResolvedFunction[] = [];

                                    if (categorySearch.trim()) {
                                        functionsToShow = searchFunctions(categorySearch, selectedCountry);
                                    } else if (selectedIndustry) {
                                        functionsToShow = getResolvedFunctions(selectedIndustry, selectedCountry);
                                    }

                                    if (functionsToShow.length > 0) {
                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {functionsToShow.map((func) => {
                                                    const isSelected = pendingSelections.includes(func.functionId);

                                                    return (
                                                        <button
                                                            key={func.functionId}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setPendingSelections(prev => prev.filter(id => id !== func.functionId));
                                                                } else {
                                                                    setPendingSelections(prev => [...prev, func.functionId]);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                                                                isSelected
                                                                    ? "border-indigo-500 bg-indigo-50"
                                                                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                                                                isSelected
                                                                    ? "bg-indigo-600 border-indigo-600"
                                                                    : "border-slate-300"
                                                            )}>
                                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={cn(
                                                                    "text-sm font-medium",
                                                                    isSelected ? "text-indigo-700" : "text-slate-700"
                                                                )}>
                                                                    {func.displayLabel}
                                                                    {func.isLocalized && (
                                                                        <span className="ml-1.5 text-xs text-indigo-400">✦</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-400 truncate">
                                                                    {categorySearch ? func.industryName : (func.isLocalized ? func.name : func.googlePlacesTypes[0])}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    } else if (categorySearch) {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                                <p>No categories found for "{categorySearch}"</p>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <Building2 className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Select an industry or search to see options</p>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </div>

                        {/* Footer with Save Button */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                                {pendingSelections.length > 0 ? (
                                    <span>{pendingSelections.length} categor{pendingSelections.length === 1 ? 'y' : 'ies'} selected</span>
                                ) : (
                                    <span>Select at least one category</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCategoryModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const categories = toSelectedCategories(pendingSelections, selectedCountry);

                                        await onUpdate('identity.businessCategories', categories);
                                        await onUpdate('identity.country', selectedCountry);

                                        if (categories.length > 0) {
                                            const firstInfo = findFunctionInfo(categories[0].functionId, selectedCountry);
                                            if (firstInfo.function && firstInfo.industry) {
                                                await onUpdate('identity.industry', {
                                                    name: firstInfo.displayLabel,
                                                    category: firstInfo.industry.industryId
                                                });
                                            }

                                            if (onModulesGenerated) {
                                                generateModulesFromCategories(categories, selectedCountry).then(result => {
                                                    if (result.success && result.config) {
                                                        onModulesGenerated(result.config);
                                                    }
                                                }).catch(console.error);
                                            }
                                        }

                                        setShowCategoryModal(false);
                                    }}
                                    disabled={pendingSelections.length === 0}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                                        pendingSelections.length > 0
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    <Check className="w-4 h-4" />
                                    Save Categories
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
