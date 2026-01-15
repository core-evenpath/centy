'use client';

import React, { useState, useMemo } from 'react';
import {
    Building2, MapPin, Target, Shield, Globe, ChevronDown,
    Edit3, Check, X, Plus, Search, LucideIcon, Landmark,
    GraduationCap, Heart, Briefcase, ShoppingBag, UtensilsCrossed,
    ShoppingCart, Sparkles, Car, Plane, PartyPopper, Wrench, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
    getCountriesForDropdown,
    type CountryCode,
    type ResolvedFunction,
    type SelectedBusinessCategory,
} from '@/lib/business-taxonomy';

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
    onSave: (val: string) => void;
    multiline?: boolean;
    placeholder?: string;
    helpText?: string;
    badge?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    const handleSave = () => {
        onSave(tempValue);
        setEditing(false);
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
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            autoFocus
                        />
                    ) : (
                        <input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
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
    onChange: (val: any) => void;
    onTagsAdd: (tag: string) => void;
    onTagsRemove: (idx: number) => void;
}) {
    switch (field.type) {
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

/**
 * Demo page to test the new Function-Driven Business Profile Schema
 *
 * Access this at: /partner/settings/schema-demo
 *
 * The new architecture:
 * - Uses business categories (functions) instead of industry types
 * - Supports multi-selection of categories
 * - Country-specific localized labels
 * - Dynamic expertise sections based on selected functions
 */
export default function SchemaProfileDemoPage() {
    // Demo persona data
    const [demoPersona, setDemoPersona] = useState<Record<string, any>>({
        identity: {
            name: 'Test Business',
            businessCategories: [],
            country: 'GLOBAL',
        },
        personality: {
            tagline: 'Quality Service, Every Time',
            description: 'A demo business showcasing the new function-driven schema system.',
        },
        location: {
            address: '123 Demo Street, Test City',
        },
        industrySpecificData: {},
    });

    // Selected categories state
    const [selectedCategories, setSelectedCategories] = useState<SelectedBusinessCategory[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>('GLOBAL');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');
    const [pendingSelections, setPendingSelections] = useState<string[]>([]);

    // Get industries from taxonomy
    const industries = getIndustries();

    // Compute sections based on selected categories
    const sections = useMemo(() => {
        const baseSections = [...BUSINESS_PROFILE_CONFIG.sections];

        // Resolve expertise schema based on selected categories
        const expertiseSchema = getExpertiseSections(selectedCategories, selectedCountry);

        // ALWAYS add the expertise section to ensure it exists for all industries
        // Use a default subsection if no specific schema is resolved
        const expertiseSection: SectionConfig = {
            id: 'expertise',
            title: 'Expertise & Specializations',
            icon: '⭐',
            description: 'Function-specific details across your business categories',
            industrySpecific: true,
            subSections: expertiseSchema.sections.length > 0 ? expertiseSchema.sections : [{
                id: 'general-expertise',
                title: 'General Information',
                fields: [{
                    key: 'description',
                    label: 'Business Description',
                    type: 'textarea',
                    helpText: 'Describe your business expertise and specializations',
                    schemaPath: 'industrySpecificData.generalDescription',
                    gridSpan: 2
                }]
            }],
        };

        // Ensure uniqueness by filtering out any existing 'expertise' section
        const filteredSections = baseSections.filter(s => s.id !== 'expertise');

        // Insert at position 2 (after Brand Identity and Location/Hours)
        filteredSections.splice(2, 0, expertiseSection);

        return filteredSections;
    }, [selectedCategories, selectedCountry]);

    const handleUpdate = (path: string, value: any) => {
        console.log(`[Schema Demo] Update: ${path} =`, value);
        const keys = path.split('.');
        setDemoPersona((prev) => {
            const result = { ...prev };
            let current: any = result;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return result;
        });
    };

    const get = (path: string, def: any = '') => {
        const keys = path.split('.');
        let current: any = demoPersona;
        for (const key of keys) {
            if (current === undefined || current === null) return def;
            current = current[key];
        }
        return current !== undefined && current !== null ? current : def;
    };

    const handleTagsAdd = (path: string, currentTags: string[]) => (tag: string) => {
        handleUpdate(path, [...currentTags, tag]);
    };

    const handleTagsRemove = (path: string, currentTags: string[]) => (index: number) => {
        const next = [...currentTags];
        next.splice(index, 1);
        handleUpdate(path, next);
    };

    const handleSaveCategories = () => {
        const categories = toSelectedCategories(pendingSelections, selectedCountry);
        setSelectedCategories(categories);
        handleUpdate('identity.businessCategories', categories);
        handleUpdate('identity.country', selectedCountry);
        setShowCategoryModal(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        🧪 Function-Driven Schema Demo
                    </h1>
                    <p className="text-slate-600">
                        Testing the new multi-category, country-localized Business Profile structure
                    </p>
                </div>

                {/* Category Selection Banner */}
                <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-medium text-slate-800">Selected Business Categories</h3>
                            <p className="text-xs text-slate-500">
                                Country: {selectedCountry} • {selectedCategories.length} categories selected
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setPendingSelections(selectedCategories.map(c => c.functionId));
                                setCategorySearch('');
                                setShowCategoryModal(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {selectedCategories.length > 0 ? 'Edit Categories' : 'Select Categories'}
                        </button>
                    </div>

                    {selectedCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedCategories.map((cat, idx) => (
                                <span
                                    key={cat.functionId}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium",
                                        idx === 0
                                            ? "bg-indigo-600 text-white"
                                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    )}
                                >
                                    {cat.label}
                                    {idx === 0 && <span className="ml-1 text-indigo-200">(Primary)</span>}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-500">
                            <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p>No categories selected. Click "Select Categories" to get started.</p>
                        </div>
                    )}
                </div>

                {/* Schema-Driven Sections */}
                {selectedCategories.length > 0 ? (
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
                                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                                    {subSection.icon && <span className="text-lg">{subSection.icon}</span>}
                                                    <h4 className="font-medium text-slate-800">{subSection.title}</h4>
                                                </div>

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
                                                                    onChange={(val) => handleUpdate(field.schemaPath, val)}
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
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                        <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium text-slate-700 mb-2">Select categories to see the schema</p>
                        <p className="text-sm text-slate-500">The profile sections will dynamically adapt based on your selected business functions.</p>
                    </div>
                )}

                {/* Debug Panel */}
                <div className="mt-8 bg-slate-800 rounded-xl p-4 text-white">
                    <h3 className="font-medium mb-2">Debug: Current State</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-xs text-slate-400 mb-1">Selected Categories</h4>
                            <pre className="text-xs overflow-auto max-h-40 text-slate-300">
                                {JSON.stringify(selectedCategories, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h4 className="text-xs text-slate-400 mb-1">Demo Persona</h4>
                            <pre className="text-xs overflow-auto max-h-40 text-slate-300">
                                {JSON.stringify(demoPersona, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Modal */}
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

                            {/* Right: Business Functions */}
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

                        {/* Footer */}
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
                                    onClick={handleSaveCategories}
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
